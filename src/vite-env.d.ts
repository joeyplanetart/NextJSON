/// <reference types="vite/client" />

interface Window {
  nextjson?: {
    openFile: () => Promise<{ name: string; content: string } | null>
    saveFile: (content: string, name?: string) => Promise<boolean>
    copy: (text: string) => void
    onOpenShortcut: (callback: () => void) => () => void
  }
}
