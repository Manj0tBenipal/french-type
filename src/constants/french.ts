export interface FrenchCharacterDefinition {
  value: string
  label: string
  shortcutHint: string
}

export const SHORTCUT_SEQUENCES: Record<string, string[]> = {
  KeyE: ['é', 'è', 'ê', 'ë'],
  KeyA: ['à', 'â', 'ä'],
  KeyC: ['ç'],
  KeyI: ['î', 'ï'],
  KeyO: ['ô', 'ö'],
  KeyU: ['ù', 'û', 'ü'],
}

export const FRENCH_CHARACTERS: FrenchCharacterDefinition[] = [
  { value: 'é', label: 'e acute', shortcutHint: 'Alt + E cycles é, è, ê, ë' },
  { value: 'è', label: 'e grave', shortcutHint: 'Alt + E cycles é, è, ê, ë' },
  { value: 'ê', label: 'e circumflex', shortcutHint: 'Alt + E cycles é, è, ê, ë' },
  { value: 'ë', label: 'e diaeresis', shortcutHint: 'Alt + E cycles é, è, ê, ë' },
  { value: 'à', label: 'a grave', shortcutHint: 'Alt + A cycles à, â, ä' },
  { value: 'â', label: 'a circumflex', shortcutHint: 'Alt + A cycles à, â, ä' },
  { value: 'ä', label: 'a diaeresis', shortcutHint: 'Alt + A cycles à, â, ä' },
  { value: 'ç', label: 'c cedilla', shortcutHint: 'Alt + C inserts ç' },
  { value: 'î', label: 'i circumflex', shortcutHint: 'Alt + I cycles î, ï' },
  { value: 'ï', label: 'i diaeresis', shortcutHint: 'Alt + I cycles î, ï' },
  { value: 'ô', label: 'o circumflex', shortcutHint: 'Alt + O cycles ô, ö' },
  { value: 'ö', label: 'o diaeresis', shortcutHint: 'Alt + O cycles ô, ö' },
  { value: 'ù', label: 'u grave', shortcutHint: 'Alt + U cycles ù, û, ü' },
  { value: 'û', label: 'u circumflex', shortcutHint: 'Alt + U cycles ù, û, ü' },
  { value: 'ü', label: 'u diaeresis', shortcutHint: 'Alt + U cycles ù, û, ü' },
  { value: 'œ', label: 'oe ligature', shortcutHint: 'Click to insert' },
  { value: 'æ', label: 'ae ligature', shortcutHint: 'Click to insert' },
  { value: '«', label: 'left guillemet', shortcutHint: 'Click to insert' },
  { value: '»', label: 'right guillemet', shortcutHint: 'Click to insert' },
  { value: '€', label: 'euro symbol', shortcutHint: 'Click to insert' },
  { value: '’', label: 'curly apostrophe', shortcutHint: 'Click to insert' },
]

export const SHORTCUT_HELP = [
  { keys: 'Alt + E', output: 'é → è → ê → ë' },
  { keys: 'Alt + A', output: 'à → â → ä' },
  { keys: 'Alt + C', output: 'ç' },
  { keys: 'Alt + I', output: 'î → ï' },
  { keys: 'Alt + O', output: 'ô → ö' },
  { keys: 'Alt + U', output: 'ù → û → ü' },
]

export function toFrenchUppercase(character: string) {
  return character.toLocaleUpperCase('fr-FR')
}
