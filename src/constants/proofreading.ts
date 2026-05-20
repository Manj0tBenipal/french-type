export const PROOFREADING_LANGUAGES = [
  { value: 'fr', label: 'French' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'fr-CA', label: 'French (Canada)' },
] as const

export const LANGUAGETOOL_PUBLIC_BASE_URL =
  import.meta.env.VITE_LANGUAGETOOL_API_BASE_URL ?? 'https://api.languagetool.org/v2'

export const LANGUAGETOOL_PUBLIC_TEXT_LIMIT_BYTES = 20_000
