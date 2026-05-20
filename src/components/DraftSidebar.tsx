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
    <div className="flex h-full min-h-0 flex-col p-3">
      <div className="mb-3 flex items-center justify-between rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Drafts
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
            {drafts.length} saved
          </p>
        </div>
        <button type="button" onClick={onCreateDraft} className="action-pill px-3">
          <FilePlus2 size={16} />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onDuplicateDraft}
          className="action-pill justify-center"
          aria-label="Duplicate draft"
        >
          <CopyPlus size={16} />
        </button>
        <button
          type="button"
          onClick={onImportDraft}
          className="action-pill justify-center"
          aria-label="Import draft"
        >
          <Import size={16} />
        </button>
        <button
          type="button"
          className="action-pill justify-center"
          onClick={() => onDeleteDraft(activeDraftId)}
          aria-label="Delete draft"
        >
          <Trash2 size={16} />
        </button>
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
                'w-full rounded-[20px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
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
                  <p className="mt-1 overflow-hidden text-sm leading-6 text-[var(--text-secondary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
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
    </div>
  )
}
