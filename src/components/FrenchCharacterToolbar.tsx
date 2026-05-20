import { FRENCH_CHARACTERS, toFrenchUppercase } from '../constants/french'

interface FrenchCharacterToolbarProps {
  onCharacterAction: (
    character: string,
    action: 'insert' | 'copy',
  ) => void | Promise<void>
}

export function FrenchCharacterToolbar({
  onCharacterAction,
}: FrenchCharacterToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Characters
        </p>
        <p className="hidden text-xs text-[var(--text-secondary)] sm:block">
          Shift for uppercase. Alt to copy.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FRENCH_CHARACTERS.map((character) => (
          <button
            key={character.value}
            type="button"
            title={`${character.shortcutHint}. Shift + click inserts uppercase. Alt + click copies.`}
            aria-label={`Insert ${character.label}`}
            className="inline-flex min-w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2.5 font-display text-xl font-semibold text-[var(--text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:min-w-14 sm:px-4 sm:py-3 sm:text-2xl"
            onMouseDown={async (event) => {
              event.preventDefault()

              const value = event.shiftKey
                ? toFrenchUppercase(character.value)
                : character.value
              const action = event.altKey ? 'copy' : 'insert'
              await onCharacterAction(value, action)
            }}
            onClick={async (event) => {
              if (event.detail !== 0) {
                return
              }

              await onCharacterAction(character.value, 'insert')
            }}
          >
            {character.value}
          </button>
        ))}
      </div>
    </div>
  )
}
