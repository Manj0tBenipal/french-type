import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  CircleHelp,
  Clipboard,
  ClipboardType,
  Download,
  FilePlus2,
  Focus,
  Languages,
  Menu,
  MoonStar,
  ScanText,
  SunMedium,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import { DraftSidebar } from './components/DraftSidebar'
import { FrenchCharacterToolbar } from './components/FrenchCharacterToolbar'
import { HelpModal } from './components/HelpModal'
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from './components/RichTextEditor'
import { WritingIssuesPanel } from './components/WritingIssuesPanel'
import { PROOFREADING_LANGUAGES } from './constants/proofreading'
import { useLanguageTool } from './hooks/useLanguageTool'
import { copyTextToClipboard } from './utils/clipboard'
import {
  createDraftFromImport,
  createEmptyDraft,
  deriveTitleFromText,
  loadActiveDraftId,
  loadDrafts,
  loadPreferences,
  saveActiveDraftId,
  saveDrafts,
  savePreferences,
} from './utils/drafts'
import type {
  DraftDocument,
  EditorSnapshot,
  Preferences,
  ProofreadingMatch,
} from './types'

function App() {
  const [drafts, setDrafts] = useState<DraftDocument[]>(() => loadDrafts())
  const [activeDraftId, setActiveDraftId] = useState<string>(() => {
    const storedActiveId = loadActiveDraftId()
    const storedDrafts = loadDrafts()
    return storedActiveId ?? storedDrafts[0]?.id ?? createEmptyDraft().id
  })
  const [preferences, setPreferences] = useState<Preferences>(() =>
    loadPreferences(),
  )
  const [helpOpen, setHelpOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Ready to write.')
  const [statusTone, setStatusTone] = useState<'default' | 'success'>('default')
  const editorRef = useRef<RichTextEditorHandle>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvedActiveDraftId =
    drafts.find((draft) => draft.id === activeDraftId)?.id ?? drafts[0]?.id ?? ''
  const activeDraft =
    drafts.find((draft) => draft.id === resolvedActiveDraftId) ??
    drafts[0] ??
    createEmptyDraft()
  const wordCount = activeDraft.plainText.trim()
    ? activeDraft.plainText.trim().split(/\s+/).length
    : 0
  const characterCount = activeDraft.plainText.length
  const activeProofreadingLanguage =
    PROOFREADING_LANGUAGES.find(
      (language) => language.value === preferences.proofreadingLanguage,
    ) ?? PROOFREADING_LANGUAGES[0]
  const {
    error: grammarCheckError,
    isChecking: isGrammarChecking,
    matches: grammarMatches,
  } = useLanguageTool({
    enabled: preferences.grammarCheckEnabled,
    language: preferences.proofreadingLanguage,
    text: activeDraft.plainText,
  })

  function announceStatus(message: string, tone: 'default' | 'success' = 'success') {
    setStatusMessage(message)
    setStatusTone(tone)

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      setStatusMessage('Ready to write.')
      setStatusTone('default')
    }, 2200)
  }

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      preferences.theme === 'dark',
    )
    savePreferences(preferences)
  }, [preferences])

  useEffect(() => {
    if (resolvedActiveDraftId) {
      saveActiveDraftId(resolvedActiveDraftId)
    }
  }, [resolvedActiveDraftId])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveDrafts(drafts)
      setStatusMessage('Saved locally.')
      setStatusTone('success')

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        setStatusMessage('Ready to write.')
        setStatusTone('default')
      }, 2200)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [drafts])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  function updateActiveDraft(snapshot: EditorSnapshot) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => {
        if (draft.id !== resolvedActiveDraftId) {
          return draft
        }

        return {
          ...draft,
          html: snapshot.html,
          plainText: snapshot.plainText,
          title: draft.titleCustomized
            ? draft.title
            : deriveTitleFromText(snapshot.plainText),
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }

  function handleCreateDraft() {
    const nextDraft = createEmptyDraft()
    startTransition(() => {
      setDrafts((currentDrafts) => [nextDraft, ...currentDrafts])
      setActiveDraftId(nextDraft.id)
      setSidebarOpen(false)
    })
    announceStatus('New draft created.')
  }

  function handleDuplicateDraft() {
    const duplicate: DraftDocument = {
      ...activeDraft,
      id: crypto.randomUUID(),
      title: `${activeDraft.title} copy`,
      titleCustomized: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    startTransition(() => {
      setDrafts((currentDrafts) => [duplicate, ...currentDrafts])
      setActiveDraftId(duplicate.id)
      setSidebarOpen(false)
    })
    announceStatus('Draft duplicated.')
  }

  function handleSelectDraft(draftId: string) {
    startTransition(() => {
      setActiveDraftId(draftId)
      setSidebarOpen(false)
    })
  }

  function handleDeleteDraft(draftId: string) {
    if (drafts.length === 1) {
      const resetDraft = createEmptyDraft()
      startTransition(() => {
        setDrafts([resetDraft])
        setActiveDraftId(resetDraft.id)
      })
      announceStatus('Draft cleared.')
      return
    }

    const currentIndex = drafts.findIndex((draft) => draft.id === draftId)
    const replacementDraft =
      drafts[currentIndex + 1] ?? drafts[currentIndex - 1] ?? drafts[0]

    startTransition(() => {
      setDrafts((currentDrafts) =>
        currentDrafts.filter((draft) => draft.id !== draftId),
      )
      if (resolvedActiveDraftId === draftId && replacementDraft) {
        setActiveDraftId(replacementDraft.id)
      }
    })

    announceStatus('Draft deleted.')
  }

  function handleRenameDraft(title: string) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === resolvedActiveDraftId
          ? {
              ...draft,
              title: title || 'Untitled note',
              titleCustomized: title.trim().length > 0,
              updatedAt: new Date().toISOString(),
            }
          : draft,
      ),
    )
  }

  async function handleInsertCharacter(
    character: string,
    action: 'insert' | 'copy',
  ) {
    if (action === 'copy') {
      await copyTextToClipboard(character)
      editorRef.current?.focus()
      announceStatus(`Copied ${character}`)
      return
    }

    editorRef.current?.insertCharacter(character)
    announceStatus(`Inserted ${character}`)
  }

  async function handleCopyRichText() {
    const copiedAsRichText = await editorRef.current?.copyRichText()
    announceStatus(copiedAsRichText ? 'Rich text copied.' : 'Copied as plain text.')
  }

  async function handleCopyPlainText() {
    await editorRef.current?.copyPlainText()
    announceStatus('Plain text copied.')
  }

  function handleSelectAll() {
    editorRef.current?.selectAll()
    announceStatus('All content selected.')
  }

  function handleClearEditor() {
    editorRef.current?.clearEditor()
    announceStatus('Editor cleared.')
  }

  function handleDownloadText() {
    editorRef.current?.downloadTextFile(activeDraft.title)
    announceStatus('Text file downloaded.')
  }

  function handleDownloadHtml() {
    editorRef.current?.downloadHtmlFile(activeDraft.title)
    announceStatus('HTML file downloaded.')
  }

  function handleImportRequest() {
    fileInputRef.current?.click()
  }

  function handleJumpToMatch(match: ProofreadingMatch) {
    editorRef.current?.focusMatch(match.offset, match.length)
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const content = await file.text()
    const importedDraft = createDraftFromImport(file.name, content)

    startTransition(() => {
      setDrafts((currentDrafts) => [importedDraft, ...currentDrafts])
      setActiveDraftId(importedDraft.id)
      setSidebarOpen(false)
    })

    announceStatus('Draft imported.')
    event.target.value = ''
  }

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(199,214,255,0.18),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_24%)] dark:bg-[radial-gradient(circle_at_top,_rgba(82,99,143,0.22),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />

      <div
        className={clsx(
          'relative flex h-full gap-3 p-3',
          preferences.focusMode && 'max-w-[1200px] mx-auto',
        )}
      >
        {!preferences.focusMode && (
          <>
            <div
              className={clsx(
                'fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition lg:hidden',
                sidebarOpen
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0',
              )}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />

            <aside
              className={clsx(
                'z-50 flex w-[18.5rem] flex-col rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-card)] backdrop-blur transition lg:static lg:block lg:translate-x-0',
                sidebarOpen
                  ? 'fixed inset-y-3 left-3 right-14 translate-x-0'
                  : 'fixed inset-y-3 left-3 right-14 -translate-x-[110%] lg:translate-x-0',
              )}
            >
              <DraftSidebar
                drafts={drafts}
                activeDraftId={resolvedActiveDraftId}
                onCreateDraft={handleCreateDraft}
                onDeleteDraft={handleDeleteDraft}
                onDuplicateDraft={handleDuplicateDraft}
                onImportDraft={handleImportRequest}
                onSelectDraft={handleSelectDraft}
              />
            </aside>
          </>
        )}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-card)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                {!preferences.focusMode && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((current) => !current)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] lg:hidden"
                    aria-label="Open drafts"
                  >
                    <Menu size={18} />
                  </button>
                )}

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    French Typing Studio
                  </p>
                  <input
                    id="draft-title"
                    value={activeDraft.title}
                    onChange={(event) => handleRenameDraft(event.target.value)}
                    className="w-full border-0 bg-transparent px-0 pt-0.5 font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:text-2xl"
                    placeholder="Untitled note"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateDraft}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <FilePlus2 size={16} />
                  <span className="hidden sm:inline">New</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      focusMode: !current.focusMode,
                    }))
                  }
                  className={clsx(
                    'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                    preferences.focusMode
                      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <Focus size={16} />
                  <span className="hidden sm:inline">Focus</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      theme: current.theme === 'light' ? 'dark' : 'light',
                    }))
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  aria-label={`Switch to ${
                    preferences.theme === 'light' ? 'dark' : 'light'
                  } mode`}
                >
                  {preferences.theme === 'light' ? (
                    <MoonStar size={16} />
                  ) : (
                    <SunMedium size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRichText}
                  className="action-pill"
                >
                  <Clipboard size={16} />
                  <span className="hidden sm:inline">Rich text</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyPlainText}
                  className="action-pill"
                >
                  <ClipboardType size={16} />
                  <span className="hidden sm:inline">Plain text</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="action-pill"
                >
                  <ScanText size={16} />
                  <span className="hidden sm:inline">Select all</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearEditor}
                  className="action-pill"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadText}
                  className="action-pill"
                  aria-label="Download as txt"
                >
                  <Download size={16} />
                  <span>.txt</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="action-pill"
                  aria-label="Download as html"
                >
                  <Download size={16} />
                  <span>.html</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Languages size={15} />
                  <span className="sr-only">Proofreading language</span>
                  <select
                    aria-label="Proofreading language"
                    value={preferences.proofreadingLanguage}
                    className="bg-transparent outline-none"
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        proofreadingLanguage: event.target.value,
                      }))
                    }
                  >
                    {PROOFREADING_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)]">
                  <span
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition',
                      preferences.grammarCheckEnabled
                        ? 'bg-[var(--accent)]'
                        : 'bg-slate-300/80 dark:bg-slate-700/90',
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition',
                        preferences.grammarCheckEnabled
                          ? 'translate-x-4'
                          : 'translate-x-1',
                      )}
                    />
                  </span>
                  <span>Check</span>
                  <input
                    type="checkbox"
                    checked={preferences.grammarCheckEnabled}
                    onChange={() =>
                      setPreferences((current) => ({
                        ...current,
                        grammarCheckEnabled: !current.grammarCheckEnabled,
                      }))
                    }
                    className="sr-only"
                    aria-label="Toggle writing check"
                  />
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)]">
                  <span
                    className={clsx(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition',
                      preferences.shortcutsEnabled
                        ? 'bg-[var(--accent)]'
                        : 'bg-slate-300/80 dark:bg-slate-700/90',
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition',
                        preferences.shortcutsEnabled
                          ? 'translate-x-4'
                          : 'translate-x-1',
                      )}
                    />
                  </span>
                  <span>Shortcuts</span>
                  <input
                    type="checkbox"
                    checked={preferences.shortcutsEnabled}
                    onChange={() =>
                      setPreferences((current) => ({
                        ...current,
                        shortcutsEnabled: !current.shortcutsEnabled,
                      }))
                    }
                    className="sr-only"
                    aria-label="Toggle accent keyboard shortcuts"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <CircleHelp size={16} />
                  <span className="hidden sm:inline">Help</span>
                </button>

                <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-secondary)] md:inline-flex">
                  <span>{wordCount}w</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                  <span>{characterCount}c</span>
                </div>

                <span
                  className={clsx(
                    'rounded-full px-3 py-2 text-xs font-semibold',
                    statusTone === 'success'
                      ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
                  )}
                >
                  {statusMessage}
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 px-3 pt-3 sm:px-4">
              <div className="h-full overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--editor)]">
                <RichTextEditor
                  ref={editorRef}
                  content={activeDraft.html}
                  grammarMatches={grammarMatches}
                  proofreadingLanguage={preferences.proofreadingLanguage}
                  shortcutsEnabled={preferences.shortcutsEnabled}
                  onContentChange={updateActiveDraft}
                  onStatus={announceStatus}
                />
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] px-3 py-3 sm:px-4">
              <div className="space-y-3 rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-3">
                <FrenchCharacterToolbar onCharacterAction={handleInsertCharacter} />
                <WritingIssuesPanel
                  enabled={preferences.grammarCheckEnabled}
                  error={grammarCheckError}
                  isChecking={isGrammarChecking}
                  languageLabel={activeProofreadingLanguage.label}
                  matches={grammarMatches}
                  onJumpToMatch={handleJumpToMatch}
                />
              </div>
            </div>
          </main>
      </div>

      <HelpModal
        open={helpOpen}
        shortcutsEnabled={preferences.shortcutsEnabled}
        onClose={() => setHelpOpen(false)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.txt"
        className="sr-only"
        onChange={handleImportFile}
      />
    </div>
  )
}

export default App
