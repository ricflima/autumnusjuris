/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MOCK_API: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}