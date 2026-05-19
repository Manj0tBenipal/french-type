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
  const sequenceRef = useRef({
    code: '',
    index: -1,
  })
  const onStatusRef = useRef(onStatus)

  useEffect(() => {
    onStatusRef.current = onStatus
  }, [onStatus])

  useEffect(() => {
    function resetSequence() {
      sequenceRef.current = { code: '', index: -1 }
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

      const nextIndex =
        sequenceRef.current.code === event.code
          ? (sequenceRef.current.index + 1) % sequence.length
          : 0

      sequenceRef.current = {
        code: event.code,
        index: nextIndex,
      }

      const value = sequence[nextIndex]
      const output = event.shiftKey ? toFrenchUppercase(value) : value
      editor.chain().focus().insertContent(output).run()
      onStatusRef.current?.(`Inserted ${output}`)
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Alt') {
        resetSequence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', resetSequence)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', resetSequence)
    }
  }, [editor, enabled])
}
