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
import type { DraftDocument, EditorSnapshot, Preferences } from './types'

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(199,214,255,0.22),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_25%)] dark:bg-[radial-gradient(circle_at_top,_rgba(82,99,143,0.28),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_25%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              French typing studio
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl">
                Write French naturally, on any keyboard.
              </h1>
              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                Rich text editor with accent shortcuts
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] lg:hidden"
            >
              <ScanText size={16} />
              Drafts
            </button>

            <button
              type="button"
              onClick={handleCreateDraft}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <FilePlus2 size={16} />
              New draft
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
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                preferences.focusMode
                  ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--text-primary)]',
              )}
            >
              <Focus size={16} />
              Focus mode
            </button>

            <button
              type="button"
              onClick={() =>
                setPreferences((current) => ({
                  ...current,
                  theme: current.theme === 'light' ? 'dark' : 'light',
                }))
              }
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-label={`Switch to ${
                preferences.theme === 'light' ? 'dark' : 'light'
              } mode`}
            >
              {preferences.theme === 'light' ? (
                <MoonStar size={16} />
              ) : (
                <SunMedium size={16} />
              )}
              {preferences.theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </header>

        <div
          className={clsx(
            'relative grid flex-1 gap-4',
            preferences.focusMode
              ? 'grid-cols-1'
              : 'grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]',
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
                  'z-50 flex flex-col rounded-[30px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-card)] backdrop-blur transition lg:static lg:block lg:translate-x-0',
                  'lg:min-h-[calc(100vh-9.5rem)]',
                  sidebarOpen
                    ? 'fixed inset-y-4 left-4 right-16 translate-x-0'
                    : 'fixed inset-y-4 left-4 right-16 -translate-x-[110%] lg:translate-x-0',
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

          <main className="min-w-0">
            <section className="rounded-[32px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-card)] backdrop-blur">
              <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <label
                      htmlFor="draft-title"
                      className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]"
                    >
                      Current draft
                    </label>
                    <input
                      id="draft-title"
                      value={activeDraft.title}
                      onChange={(event) => handleRenameDraft(event.target.value)}
                      className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-4 py-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-border)] focus:ring-2 focus:ring-[var(--focus-ring)] sm:text-3xl"
                      placeholder="Untitled note"
                    />
                    <p className="text-sm text-[var(--text-secondary)]">
                      Local-first writing workspace for French accents, ligatures,
                      and polished text formatting.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyRichText}
                      className="action-pill"
                    >
                      <Clipboard size={16} />
                      Copy rich text
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPlainText}
                      className="action-pill"
                    >
                      <ClipboardType size={16} />
                      Copy plain text
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="action-pill"
                    >
                      <ScanText size={16} />
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadText}
                      className="action-pill"
                    >
                      <Download size={16} />
                      .txt
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadHtml}
                      className="action-pill"
                    >
                      <Download size={16} />
                      .html
                    </button>
                    <button
                      type="button"
                      onClick={handleClearEditor}
                      className="action-pill"
                    >
                      <Trash2 size={16} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)]">
                      <span
                        className={clsx(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition',
                          preferences.shortcutsEnabled
                            ? 'bg-[var(--accent)]'
                            : 'bg-slate-300/80 dark:bg-slate-700/90',
                        )}
                      >
                        <span
                          className={clsx(
                            'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition',
                            preferences.shortcutsEnabled
                              ? 'translate-x-5'
                              : 'translate-x-1',
                          )}
                        />
                      </span>
                      <span>Accent shortcuts</span>
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
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent-border)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      <CircleHelp size={16} />
                      Keyboard help
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{wordCount} words</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                    <span>{characterCount} characters</span>
                    <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        statusTone === 'success'
                          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
                          : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
                      )}
                    >
                      {statusMessage}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                <RichTextEditor
                  ref={editorRef}
                  content={activeDraft.html}
                  shortcutsEnabled={preferences.shortcutsEnabled}
                  onContentChange={updateActiveDraft}
                  onStatus={announceStatus}
                />
              </div>

              <div className="border-t border-[var(--border-subtle)] px-3 py-3 sm:px-4">
                <FrenchCharacterToolbar onCharacterAction={handleInsertCharacter} />
              </div>
            </section>
          </main>
        </div>
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
