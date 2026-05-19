export type ThemeMode = 'light' | 'dark'

export interface DraftDocument {
  id: string
  title: string
  titleCustomized: boolean
  html: string
  plainText: string
  createdAt: string
  updatedAt: string
}

export interface Preferences {
  theme: ThemeMode
  shortcutsEnabled: boolean
  focusMode: boolean
}

export interface EditorSnapshot {
  html: string
  plainText: string
  wordCount: number
  characterCount: number
}
