import { useEffect } from 'react'
import { X } from 'lucide-react'
import { SHORTCUT_HELP } from '../constants/french'

interface HelpModalProps {
  open: boolean
  shortcutsEnabled: boolean
  onClose: () => void
}

export function HelpModal({ open, shortcutsEnabled, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div className="w-full max-w-2xl rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Keyboard help
            </p>
            <h2
              id="keyboard-help-title"
              className="font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]"
            >
              Fast French accent entry
            </h2>
            <p className="max-w-xl text-sm text-[var(--text-secondary)]">
              Shortcuts currently{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {shortcutsEnabled ? 'enabled' : 'disabled'}
              </span>
              . Hold <kbd className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs">Alt</kbd>{' '}
              or <kbd className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-xs">Option</kbd>{' '}
              and repeat the base letter to cycle through accents.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label="Close keyboard help"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Shortcut map
            </h3>
            <div className="space-y-2">
              {SHORTCUT_HELP.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3"
                >
                  <span className="font-semibold text-[var(--text-primary)]">
                    {shortcut.keys}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {shortcut.output}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Pointer behavior
              </h3>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Click any character button to insert at the current caret. Use{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  Shift + click
                </span>{' '}
                for uppercase and{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  Alt + click
                </span>{' '}
                to copy only that character.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Editor actions
              </h3>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Rich text copy preserves formatting when the browser clipboard API
                supports HTML. Plain text copy strips styles. Use the toolbar for
                headings, lists, alignment, undo, redo, and clear formatting.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Drafts
              </h3>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Notes save automatically to local storage. Open any saved draft
                from the sidebar and continue where you left off.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
