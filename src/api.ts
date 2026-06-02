/**
 * StatusPro API client
 *
 * Thin wrapper around fetch that:
 *  - Attaches the X-Device-ID header on every request
 *  - Handles the X-Assigned-Device-ID response header (first-time devices)
 *  - Throws typed errors on non-2xx responses
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ── Device ID persistence ─────────────────────────────────────────────────────

const DEVICE_ID_KEY = 'statuspro-device-id';

function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable
  }
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

function saveAssignedDeviceId(headers: Headers): void {
  const assigned = headers.get('X-Assigned-Device-ID');
  if (assigned) {
    try {
      localStorage.setItem(DEVICE_ID_KEY, assigned);
    } catch {
      // ignore
    }
  }
}

// ── Base fetch wrapper ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = 45000 // 45s default timeout
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init.headers);
  headers.set('X-Device-ID', getDeviceId());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. The server took too long to respond.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  saveAssignedDeviceId(res.headers);

  if (!res.ok) {
    let error = `HTTP ${res.status}`;
    let details: string | undefined;
    try {
      const body = await res.json() as { error?: string; details?: string };
      if (body.error) error = body.error;
      if (body.details) details = body.details;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, error, details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ── API methods ───────────────────────────────────────────────────────────────

export interface UploadResponse {
  mediaId: string;
  url: string;
  name: string;
  sizeLabel: string;
  mimeType: string;
  type: 'photo' | 'video';
}

export interface ProcessResponse {
  mediaId: string;
  url: string;
  name: string;
  sizeLabel: string;
  /** Size of the original before processing — used to show savings in the UI */
  originalSizeLabel?: string;
}

export interface HistoryEntry {
  id: string;
  deviceId: string;
  mediaId: string;
  type: 'photo' | 'video';
  name: string;
  url: string;
  sizeLabel: string;
  caption: string;
  qualityMode: 'ultra' | 'smart' | 'auto';
  sharedAt: string;
}

export interface HistoryListResponse {
  items: HistoryEntry[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Upload a file to the server.
 * Returns a mediaId and a persistent public URL.
 */
export async function uploadMedia(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);

  const deviceId = getDeviceId();
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: { 'X-Device-ID': deviceId },
    body: form,
  });

  saveAssignedDeviceId(res.headers);

  if (!res.ok) {
    let error = `Upload failed (HTTP ${res.status})`;
    try {
      const body = await res.json() as { error?: string; details?: string };
      if (body.error) error = body.error;
    } catch { /* ignore */ }
    throw new ApiError(res.status, error);
  }

  return res.json() as Promise<UploadResponse>;
}

/**
 * Convert a previously uploaded image to a short MP4 video for WhatsApp Status.
 *
 * Pipeline (server-side):
 *   1. Compress image to ≤ 700 KB (iterating WebP quality downward)
 *   2. Wrap the compressed image as a 7-second MP4 (libx264, yuv420p)
 *
 * Sharing the result as a video status preserves HD quality because WhatsApp
 * does not re-compress video statuses the way it does photo statuses.
 */
export async function convertImageToVideo(mediaId: string): Promise<ProcessResponse> {
  return apiFetch<ProcessResponse>('/api/image-to-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId }),
  });
}

/**
 * Ask the server to compress a previously uploaded image.
 * Preserves original dimensions — only reduces file size via WebP encoding.
 */
export async function compressMedia(
  mediaId: string,
  level: 'low' | 'medium' | 'high',
): Promise<ProcessResponse> {
  return apiFetch<ProcessResponse>('/api/compress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId, level }),
  });
}

/**
 * Ask the server to process a previously uploaded file.
 * For Auto mode on JPEG photos this triggers a server-side re-encode.
 * For all other cases the original file URL is returned immediately.
 */
export async function processMedia(
  mediaId: string,
  qualityMode: 'ultra' | 'smart' | 'auto',
): Promise<ProcessResponse> {
  return apiFetch<ProcessResponse>('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId, qualityMode }),
  });
}

/**
 * Save a history entry after a successful share.
 */
export async function saveHistory(
  mediaId: string,
  caption: string,
  qualityMode: 'ultra' | 'smart' | 'auto',
): Promise<HistoryEntry> {
  return apiFetch<HistoryEntry>('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaId, caption, qualityMode }),
  });
}

/**
 * Fetch the device's share history.
 */
export async function fetchHistory(
  limit = 50,
  offset = 0,
): Promise<HistoryListResponse> {
  return apiFetch<HistoryListResponse>(
    `/api/history?limit=${limit}&offset=${offset}`,
  );
}

/**
 * Delete a history entry.
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  return apiFetch<void>(`/api/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Delete a media file and all its history entries.
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  return apiFetch<void>(`/api/media/${encodeURIComponent(mediaId)}`, {
    method: 'DELETE',
  });
}
