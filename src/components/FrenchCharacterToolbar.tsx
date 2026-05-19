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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            French character palette
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Click to insert, hold <kbd className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs">Shift</kbd>{' '}
            for uppercase, or{' '}
            <kbd className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs">Alt</kbd>{' '}
            to copy a single character.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FRENCH_CHARACTERS.map((character) => (
          <button
            key={character.value}
            type="button"
            title={`${character.shortcutHint}. Shift + click inserts uppercase. Alt + click copies.`}
            aria-label={`Insert ${character.label}`}
            className="inline-flex min-w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3 font-display text-2xl font-semibold text-[var(--text-primary)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
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
