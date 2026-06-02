export type ViewState = 'home' | 'preview' | 'history' | 'compress';

export interface MediaItem {
  id: string;
  /** Server-assigned media ID — present after a successful upload */
  mediaId?: string;
  type: 'photo' | 'video';
  url: string;       // object URL (local) or server URL (after upload)
  file?: File;       // original File object — used for lossless local export
  name: string;
  size: string;
  date: string;
  mimeType?: string; // original MIME type e.g. 'image/jpeg', 'image/png'
  /** Caption entered by the user */
  caption?: string;
  /** True when the file has been uploaded to the server */
  uploaded?: boolean;
}