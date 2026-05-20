import type { DraftDocument, Preferences } from '../types'

const DRAFTS_STORAGE_KEY = 'french-type:drafts'
const ACTIVE_DRAFT_STORAGE_KEY = 'french-type:active-draft'
const PREFERENCES_STORAGE_KEY = 'french-type:preferences'

function now() {
  return new Date().toISOString()
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function deriveTitleFromText(plainText: string) {
  const firstLine = plainText
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return firstLine?.slice(0, 50) || 'Untitled note'
}

export function createEmptyDraft(): DraftDocument {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled note',
    titleCustomized: false,
    html: '<p></p>',
    plainText: '',
    createdAt: now(),
    updatedAt: now(),
  }
}

export function createDraftFromImport(filename: string, content: string): DraftDocument {
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(content)
  const plainText = isHtml
    ? content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : content

  return {
    id: crypto.randomUUID(),
    title: filename.replace(/\.[^.]+$/, '') || deriveTitleFromText(plainText),
    titleCustomized: true,
    html: isHtml
      ? content
      : `<p>${escapeHtml(content).replace(/\n/g, '</p><p>')}</p>`,
    plainText,
    createdAt: now(),
    updatedAt: now(),
  }
}

export function loadDrafts() {
  const fallbackDrafts = [createEmptyDraft()]
  const storedDrafts = window.localStorage.getItem(DRAFTS_STORAGE_KEY)

  if (!storedDrafts) {
    return fallbackDrafts
  }

  try {
    const parsedDrafts = JSON.parse(storedDrafts) as DraftDocument[]
    return parsedDrafts.length > 0 ? parsedDrafts : fallbackDrafts
  } catch {
    return fallbackDrafts
  }
}

export function saveDrafts(drafts: DraftDocument[]) {
  window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
}

export function loadActiveDraftId() {
  return window.localStorage.getItem(ACTIVE_DRAFT_STORAGE_KEY)
}

export function saveActiveDraftId(draftId: string) {
  window.localStorage.setItem(ACTIVE_DRAFT_STORAGE_KEY, draftId)
}

export function loadPreferences(): Preferences {
  const fallback: Preferences = {
    theme: 'light',
    shortcutsEnabled: true,
    focusMode: false,
    grammarCheckEnabled: true,
    proofreadingLanguage: 'fr',
  }
  const storedPreferences = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)

  if (!storedPreferences) {
    return fallback
  }

  try {
    return {
      ...fallback,
      ...(JSON.parse(storedPreferences) as Partial<Preferences>),
    }
  } catch {
    return fallback
  }
}

export function savePreferences(preferences: Preferences) {
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  )
}
