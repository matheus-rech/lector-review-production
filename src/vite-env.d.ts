/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AI?: string;
  readonly VITE_ENABLE_CLOUD?: string;
  readonly VITE_ENABLE_COLLAB?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_PLUGINS?: string;
  readonly VITE_ENABLE_EXPERIMENTAL?: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
