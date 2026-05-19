import { CopyPlus, FilePlus2, Import, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import type { DraftDocument } from '../types'

interface DraftSidebarProps {
  drafts: DraftDocument[]
  activeDraftId: string
  onCreateDraft: () => void
  onDeleteDraft: (draftId: string) => void
  onDuplicateDraft: () => void
  onImportDraft: () => void
  onSelectDraft: (draftId: string) => void
}

function formatUpdatedAt(timestamp: string) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

export function DraftSidebar({
  drafts,
  activeDraftId,
  onCreateDraft,
  onDeleteDraft,
  onDuplicateDraft,
  onImportDraft,
  onSelectDraft,
}: DraftSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="mb-4 rounded-[26px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Local drafts
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          Saved writing sessions
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
          Every change stays on this device. Create multiple drafts and reopen
          them from here.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCreateDraft} className="action-pill justify-center">
          <FilePlus2 size={16} />
          New
        </button>
        <button
          type="button"
          onClick={onDuplicateDraft}
          className="action-pill justify-center"
        >
          <CopyPlus size={16} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={onImportDraft}
          className="action-pill justify-center"
        >
          <Import size={16} />
          Import
        </button>
        <button
          type="button"
          className="action-pill justify-center"
          onClick={() => onDeleteDraft(activeDraftId)}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
        <span>Recent drafts</span>
        <span>{drafts.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {drafts.map((draft) => {
          const preview = draft.plainText.trim() || 'Empty draft'

          return (
            <button
              key={draft.id}
              type="button"
              onClick={() => onSelectDraft(draft.id)}
              className={clsx(
                'w-full rounded-[24px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                draft.id === activeDraftId
                  ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] hover:border-[var(--accent-border)] hover:bg-[var(--surface)]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                    {draft.title}
                  </p>
                  <p className="mt-2 overflow-hidden text-sm leading-6 text-[var(--text-secondary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {preview}
                  </p>
                </div>
                {draft.id === activeDraftId ? (
                  <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Open
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                {formatUpdatedAt(draft.updatedAt)}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
        Use <span className="font-semibold text-[var(--text-primary)]">Copy rich text</span>{' '}
        before pasting into apps that support formatting. Export is available as{' '}
        <span className="font-semibold text-[var(--text-primary)]">.txt</span> or{' '}
        <span className="font-semibold text-[var(--text-primary)]">.html</span>.
      </div>
    </div>
  )
}
