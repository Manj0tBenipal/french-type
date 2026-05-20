import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { FormattingToolbar } from './FormattingToolbar'
import { FontSize } from '../extensions/fontSize'
import { useFrenchShortcuts } from '../hooks/useFrenchShortcuts'
import { copyRichTextToClipboard, copyTextToClipboard } from '../utils/clipboard'
import { downloadHtmlFile, downloadPlainTextFile } from '../utils/export'
import type { EditorSnapshot, ProofreadingMatch } from '../types'

const grammarPluginKey = new PluginKey<{ decorations: DecorationSet }>(
  'grammarIssues',
)

function getOffsetPositionMap(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const positionsByOffset: number[] = []
  let offset = 0
  let hasSeenTextBlock = false

  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (hasSeenTextBlock) {
        offset += 1
      }
      hasSeenTextBlock = true
    }

    if (!node.isText) {
      return
    }

    const text = node.text ?? ''

    for (let index = 0; index < text.length; index += 1) {
      positionsByOffset[offset] = pos + index
      offset += 1
    }
  })

  return positionsByOffset
}

function getDocRangeFromOffsets(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  offset: number,
  length: number,
) {
  const positionsByOffset = getOffsetPositionMap(editor)
  const start = positionsByOffset[offset]
  const endPosition = positionsByOffset[offset + Math.max(length - 1, 0)]

  if (start === undefined || endPosition === undefined) {
    return null
  }

  return {
    from: start,
    to: endPosition + 1,
  }
}

function createGrammarDecorations(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  matches: ProofreadingMatch[],
) {
  const decorations = matches.flatMap((match) => {
    const range = getDocRangeFromOffsets(editor, match.offset, match.length)
    if (!range) {
      return []
    }

    return [
      Decoration.inline(range.from, range.to, {
        class: 'lt-issue',
        'data-rule-id': match.ruleId,
        title: match.message,
      }),
    ]
  })

  return DecorationSet.create(editor.state.doc, decorations)
}

export interface RichTextEditorHandle {
  clearEditor: () => void
  copyPlainText: () => Promise<void>
  copyRichText: () => Promise<boolean>
  downloadHtmlFile: (title: string) => void
  downloadTextFile: (title: string) => void
  focus: () => void
  focusMatch: (offset: number, length: number) => void
  insertCharacter: (character: string) => void
  selectAll: () => void
}

interface RichTextEditorProps {
  content: string
  grammarMatches: ProofreadingMatch[]
  proofreadingLanguage: string
  shortcutsEnabled: boolean
  spellcheckEnabled?: boolean
  onContentChange: (snapshot: EditorSnapshot) => void
  onStatus?: (message: string) => void
}

function getPlainText(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return editor.state.doc.textBetween(
    0,
    editor.state.doc.content.size,
    '\n',
    '\n',
  )
}

function getSnapshot(editor: NonNullable<ReturnType<typeof useEditor>>) {
  const plainText = getPlainText(editor)
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0

  return {
    html: editor.getHTML(),
    plainText,
    wordCount,
    characterCount: plainText.length,
  }
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    content,
    grammarMatches,
    proofreadingLanguage,
    shortcutsEnabled,
    spellcheckEnabled = false,
    onContentChange,
    onStatus,
  },
  ref,
) {
  const onContentChangeRef = useRef(onContentChange)
  const grammarMatchesRef = useRef(grammarMatches)
  const grammarPluginRef = useRef(
    new Plugin({
      key: grammarPluginKey,
      state: {
        init: () => ({
          decorations: DecorationSet.empty,
        }),
        apply(transaction, pluginState, _oldState, newState) {
          const nextMatches = transaction.getMeta(grammarPluginKey) as
            | ProofreadingMatch[]
            | undefined

          if (nextMatches) {
            const editorLike = {
              state: newState,
            } as NonNullable<ReturnType<typeof useEditor>>
            return {
              decorations: createGrammarDecorations(editorLike, nextMatches),
            }
          }

          if (transaction.docChanged) {
            return {
              decorations: pluginState.decorations.map(
                transaction.mapping,
                transaction.doc,
              ),
            }
          }

          return pluginState
        },
      },
      props: {
        decorations(state) {
          return grammarPluginKey.getState(state)?.decorations ?? null
        },
      },
    }),
  )

  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

  useEffect(() => {
    grammarMatchesRef.current = grammarMatches
  }, [grammarMatches])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontSize,
      Placeholder.configure({
        placeholder:
          'Compose in French, format as you go, and use Alt shortcuts for accents.',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'tiptap rounded-[26px] px-5 py-5 sm:px-7 sm:py-6 caret-[var(--accent)]',
        lang: proofreadingLanguage,
        spellcheck: spellcheckEnabled ? 'true' : 'false',
      },
    },
    onCreate: ({ editor: editorInstance }) => {
      onContentChangeRef.current(getSnapshot(editorInstance))
    },
    onUpdate: ({ editor: editorInstance }) => {
      onContentChangeRef.current(getSnapshot(editorInstance))
    },
  })

  useFrenchShortcuts({
    editor,
    enabled: shortcutsEnabled,
    onStatus,
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.unregisterPlugin(grammarPluginKey)
    editor.registerPlugin(grammarPluginRef.current)

    editor.view.dispatch(
      editor.state.tr.setMeta(grammarPluginKey, grammarMatchesRef.current),
    )

    return () => {
      editor.unregisterPlugin(grammarPluginKey)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    const normalizedContent = content || '<p></p>'
    if (editor.getHTML() !== normalizedContent) {
      editor.commands.setContent(normalizedContent, { emitUpdate: false })
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.view.dom.setAttribute('lang', proofreadingLanguage)
    editor.view.dom.setAttribute(
      'spellcheck',
      spellcheckEnabled ? 'true' : 'false',
    )
  }, [editor, proofreadingLanguage, spellcheckEnabled])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.view.dispatch(editor.state.tr.setMeta(grammarPluginKey, grammarMatches))
  }, [editor, grammarMatches])

  useImperativeHandle(
    ref,
    () => ({
      clearEditor() {
        editor?.chain().focus().clearContent(true).run()
      },
      async copyPlainText() {
        if (!editor) {
          return
        }

        await copyTextToClipboard(getPlainText(editor))
      },
      async copyRichText() {
        if (!editor) {
          return false
        }

        return copyRichTextToClipboard(editor.getHTML(), getPlainText(editor))
      },
      downloadHtmlFile(title: string) {
        if (!editor) {
          return
        }

        downloadHtmlFile(title, editor.getHTML())
      },
      downloadTextFile(title: string) {
        if (!editor) {
          return
        }

        downloadPlainTextFile(title, getPlainText(editor))
      },
      focus() {
        editor?.chain().focus().run()
      },
      focusMatch(offset: number, length: number) {
        if (!editor) {
          return
        }

        const range = getDocRangeFromOffsets(editor, offset, length)
        if (!range) {
          return
        }

        editor
          .chain()
          .focus()
          .setTextSelection({ from: range.from, to: range.to })
          .run()
        editor.view.dom.scrollIntoView({
          block: 'center',
          behavior: 'smooth',
        })
      },
      insertCharacter(character: string) {
        editor?.chain().focus().insertContent(character).run()
      },
      selectAll() {
        editor?.chain().focus().selectAll().run()
      },
    }),
    [editor],
  )

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--text-secondary)]">
        Loading editor…
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] shadow-[var(--shadow-card)]">
      <FormattingToolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})
