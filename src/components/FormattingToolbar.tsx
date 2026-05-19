import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  RotateCcw,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Bold,
} from 'lucide-react'

interface FormattingToolbarProps {
  editor: Editor
}

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '32px']

function ToolbarButton({
  active,
  label,
  icon,
  onClick,
}: {
  active?: boolean
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="toolbar-button"
      data-active={active ? 'true' : 'false'}
      aria-label={label}
      title={label}
      onMouseDown={(event) => {
        event.preventDefault()
        onClick()
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          onClick()
        }
      }}
    >
      {icon}
    </button>
  )
}

export function FormattingToolbar({ editor }: FormattingToolbarProps) {
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '18px'
  const headingLevel = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph'

  return (
    <div className="sticky top-3 z-20 mb-4 overflow-x-auto rounded-[26px] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-3 shadow-[var(--shadow-card)]">
      <div className="flex min-w-max items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
            <Type size={16} />
            <span className="sr-only">Font size</span>
            <select
              aria-label="Font size"
              value={currentFontSize}
              className="bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none"
              onChange={(event) =>
                editor.chain().focus().setFontSize(event.target.value).run()
              }
            >
              {FONT_SIZES.map((fontSize) => (
                <option key={fontSize} value={fontSize}>
                  {fontSize.replace('px', '')} px
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <ToolbarButton
            active={headingLevel === 'paragraph'}
            label="Paragraph"
            icon={<span className="px-1 text-xs font-bold uppercase">P</span>}
            onClick={() => editor.chain().focus().setParagraph().run()}
          />
          <ToolbarButton
            active={headingLevel === 'h1'}
            label="Heading 1"
            icon={<Heading1 size={17} />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            active={headingLevel === 'h2'}
            label="Heading 2"
            icon={<Heading2 size={17} />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            active={headingLevel === 'h3'}
            label="Heading 3"
            icon={<Heading3 size={17} />}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <ToolbarButton
            active={editor.isActive('bold')}
            label="Bold"
            icon={<Bold size={16} />}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            active={editor.isActive('italic')}
            label="Italic"
            icon={<Italic size={16} />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            active={editor.isActive('underline')}
            label="Underline"
            icon={<UnderlineIcon size={16} />}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            active={editor.isActive('strike')}
            label="Strikethrough"
            icon={<Strikethrough size={16} />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <ToolbarButton
            active={editor.isActive({ textAlign: 'left' })}
            label="Align left"
            icon={<AlignLeft size={16} />}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          />
          <ToolbarButton
            active={editor.isActive({ textAlign: 'center' })}
            label="Align center"
            icon={<AlignCenter size={16} />}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          />
          <ToolbarButton
            active={editor.isActive({ textAlign: 'right' })}
            label="Align right"
            icon={<AlignRight size={16} />}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          />
          <ToolbarButton
            active={editor.isActive({ textAlign: 'justify' })}
            label="Justify"
            icon={<AlignJustify size={16} />}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          />
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <ToolbarButton
            active={editor.isActive('bulletList')}
            label="Bulleted list"
            icon={<List size={16} />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            active={editor.isActive('orderedList')}
            label="Numbered list"
            icon={<ListOrdered size={16} />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
          <ToolbarButton
            label="Undo"
            icon={<RotateCcw size={16} />}
            onClick={() => editor.chain().focus().undo().run()}
          />
          <ToolbarButton
            label="Redo"
            icon={<Redo2 size={16} />}
            onClick={() => editor.chain().focus().redo().run()}
          />
          <ToolbarButton
            label="Clear formatting"
            icon={<RemoveFormatting size={16} />}
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().unsetFontSize().run()
            }
          />
        </div>
      </div>
    </div>
  )
}
