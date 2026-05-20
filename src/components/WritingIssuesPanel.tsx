import { ExternalLink, Languages, LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react'
import type { ProofreadingMatch } from '../types'

interface WritingIssuesPanelProps {
  enabled: boolean
  error: string
  isChecking: boolean
  languageLabel: string
  matches: ProofreadingMatch[]
  onJumpToMatch: (match: ProofreadingMatch) => void
}

function renderContext(match: ProofreadingMatch) {
  const before = match.contextText.slice(0, match.contextOffset)
  const problem = match.contextText.slice(
    match.contextOffset,
    match.contextOffset + match.length,
  )
  const after = match.contextText.slice(match.contextOffset + match.length)

  return (
    <span>
      {before}
      <mark className="rounded bg-amber-400/25 px-1 text-[var(--text-primary)]">
        {problem}
      </mark>
      {after}
    </span>
  )
}

export function WritingIssuesPanel({
  enabled,
  error,
  isChecking,
  languageLabel,
  matches,
  onJumpToMatch,
}: WritingIssuesPanelProps) {
  const visibleMatches = matches.slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 font-medium text-[var(--text-secondary)]">
            <Languages size={15} />
            {languageLabel}
          </span>

          {isChecking ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[var(--text-secondary)]">
              <LoaderCircle size={15} className="animate-spin" />
              Checking
            </span>
          ) : error ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300">
              <TriangleAlert size={15} />
              {error}
            </span>
          ) : enabled ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[var(--text-secondary)]">
              <Sparkles size={15} />
              {matches.length === 0 ? 'No issues found' : `${matches.length} issues found`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-[var(--text-secondary)]">
              <Sparkles size={15} />
              Writing check off
            </span>
          )}
        </div>

        <a
          href="https://languagetool.org"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          Powered by LanguageTool
          <ExternalLink size={13} />
        </a>
      </div>

      {visibleMatches.length > 0 ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {visibleMatches.map((match) => (
            <button
              key={match.id}
              type="button"
              onClick={() => onJumpToMatch(match)}
              className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {match.shortMessage || match.message}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {renderContext(match)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {match.category}
                </span>
              </div>
              {match.replacements.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {match.replacements.slice(0, 3).map((replacement) => (
                    <span
                      key={replacement}
                      className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
                    >
                      {replacement}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
