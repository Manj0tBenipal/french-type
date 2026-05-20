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
  grammarCheckEnabled: boolean
  proofreadingLanguage: string
}

export interface EditorSnapshot {
  html: string
  plainText: string
  wordCount: number
  characterCount: number
}

export interface ProofreadingMatch {
  id: string
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: string[]
  contextText: string
  contextOffset: number
  ruleId: string
  category: string
}
