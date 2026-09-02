/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARBINE_LOCAL_FVS_URL?: string;
  readonly VITE_CARBINE_BUILD_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
