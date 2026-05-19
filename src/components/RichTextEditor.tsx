import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
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
import type { EditorSnapshot } from '../types'

export interface RichTextEditorHandle {
  clearEditor: () => void
  copyPlainText: () => Promise<void>
  copyRichText: () => Promise<boolean>
  downloadHtmlFile: (title: string) => void
  downloadTextFile: (title: string) => void
  focus: () => void
  insertCharacter: (character: string) => void
  selectAll: () => void
}

interface RichTextEditorProps {
  content: string
  shortcutsEnabled: boolean
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
  { content, shortcutsEnabled, onContentChange, onStatus },
  ref,
) {
  const onContentChangeRef = useRef(onContentChange)
  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

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

    const normalizedContent = content || '<p></p>'
    if (editor.getHTML() !== normalizedContent) {
      editor.commands.setContent(normalizedContent, { emitUpdate: false })
    }
  }, [content, editor])

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
      <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-6 text-sm text-[var(--text-secondary)]">
        Loading editor…
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.03))] shadow-[var(--shadow-card)]">
      <FormattingToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
})
