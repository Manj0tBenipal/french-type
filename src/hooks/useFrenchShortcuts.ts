import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { SHORTCUT_SEQUENCES, toFrenchUppercase } from '../constants/french'

interface UseFrenchShortcutsOptions {
  editor: Editor | null
  enabled: boolean
  onStatus?: (message: string) => void
}

export function useFrenchShortcuts({
  editor,
  enabled,
  onStatus,
}: UseFrenchShortcutsOptions) {
  const shortcutInsertionRef = useRef({
    code: '',
    from: -1,
    to: -1,
    index: -1,
  })
  const onStatusRef = useRef(onStatus)

  useEffect(() => {
    onStatusRef.current = onStatus
  }, [onStatus])

  useEffect(() => {
    function resetSequence() {
      shortcutInsertionRef.current = {
        code: '',
        from: -1,
        to: -1,
        index: -1,
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!enabled || !editor?.isFocused || !event.altKey) {
        return
      }

      const sequence = SHORTCUT_SEQUENCES[event.code]
      if (!sequence) {
        return
      }

      event.preventDefault()

      const { from, to } = editor.state.selection
      const activeInsertion = shortcutInsertionRef.current
      const currentTrackedCharacter =
        activeInsertion.from >= 0 && activeInsertion.to >= activeInsertion.from
          ? editor.state.doc.textBetween(
              activeInsertion.from,
              activeInsertion.to,
              '',
              '',
            )
          : ''
      const canAlterPreviousShortcutCharacter =
        from === to &&
        activeInsertion.code === event.code &&
        activeInsertion.to === from &&
        currentTrackedCharacter.length > 0

      const nextIndex = canAlterPreviousShortcutCharacter
        ? (activeInsertion.index + 1) % sequence.length
        : 0

      const value = sequence[nextIndex]
      const output = event.shiftKey ? toFrenchUppercase(value) : value

      // Once an accent character was produced by a shortcut, later presses on
      // the same shortcut mutate that character in place instead of appending.
      if (canAlterPreviousShortcutCharacter) {
        editor
          .chain()
          .focus()
          .insertContentAt(
            { from: activeInsertion.from, to: activeInsertion.to },
            output,
          )
          .setTextSelection(activeInsertion.from + output.length)
          .run()

        shortcutInsertionRef.current = {
          code: event.code,
          from: activeInsertion.from,
          to: activeInsertion.from + output.length,
          index: nextIndex,
        }
        onStatusRef.current?.(`Updated to ${output}`)
        return
      }

      editor.chain().focus().insertContent(output).run()

      shortcutInsertionRef.current = {
        code: event.code,
        from,
        to: from + output.length,
        index: nextIndex,
      }
      onStatusRef.current?.(`Inserted ${output}`)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', resetSequence)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', resetSequence)
    }
  }, [editor, enabled])
}
