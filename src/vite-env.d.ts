/// <reference types="vite/client" />

interface Window {
  nextjson?: {
    openFile: () => Promise<{ name: string; content: string } | null>
    saveFile: (content: string, name?: string, format?: 'json' | 'yaml' | 'xml') => Promise<boolean>
    saveImage: (bytes: Uint8Array, name: string, format: 'jpeg' | 'png' | 'webp') => Promise<boolean>
    copy: (text: string) => void
    onOpenShortcut: (callback: () => void) => () => void
  }
}
