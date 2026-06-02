/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL. Empty string in dev (Vite proxy handles routing). */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
