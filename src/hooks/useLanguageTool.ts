import { useEffect, useState } from 'react'
import {
  canCheckWithPublicLanguageTool,
  checkTextWithLanguageTool,
} from '../utils/languageTool'
import type { ProofreadingMatch } from '../types'

interface UseLanguageToolOptions {
  enabled: boolean
  language: string
  text: string
}

interface UseLanguageToolResult {
  error: string
  isChecking: boolean
  matches: ProofreadingMatch[]
}

export function useLanguageTool({
  enabled,
  language,
  text,
}: UseLanguageToolOptions): UseLanguageToolResult {
  const [matches, setMatches] = useState<ProofreadingMatch[]>([])
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const trimmedText = text.trim()
  const canCheck = enabled && trimmedText.length > 0
  const isTooLarge = canCheck && !canCheckWithPublicLanguageTool(text)

  useEffect(() => {
    if (!canCheck || isTooLarge) {
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsChecking(true)
        setError('')
        const nextMatches = await checkTextWithLanguageTool(
          text,
          language,
          controller.signal,
        )
        setMatches(nextMatches)
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setMatches([])
        setError(
          error instanceof Error
            ? 'LanguageTool check is unavailable right now.'
            : 'Unable to check this text right now.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsChecking(false)
        }
      }
    }, 700)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [canCheck, isTooLarge, language, text])

  return {
    error: canCheck ? (isTooLarge ? 'Cloud check is limited to about 20 KB per request.' : error) : '',
    isChecking: canCheck && !isTooLarge ? isChecking : false,
    matches: canCheck && !isTooLarge ? matches : [],
  }
}
