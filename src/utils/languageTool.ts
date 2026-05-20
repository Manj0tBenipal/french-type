import {
  LANGUAGETOOL_PUBLIC_BASE_URL,
  LANGUAGETOOL_PUBLIC_TEXT_LIMIT_BYTES,
} from '../constants/proofreading'
import type { ProofreadingMatch } from '../types'

interface LanguageToolResponse {
  matches: Array<{
    message: string
    shortMessage?: string
    offset: number
    length: number
    replacements: Array<{ value: string }>
    context: {
      text: string
      offset: number
      length: number
    }
    rule: {
      id: string
      category: {
        id: string
        name: string
      }
    }
  }>
}

export function getTextSizeInBytes(text: string) {
  return new TextEncoder().encode(text).length
}

export function canCheckWithPublicLanguageTool(text: string) {
  return getTextSizeInBytes(text) <= LANGUAGETOOL_PUBLIC_TEXT_LIMIT_BYTES
}

export async function checkTextWithLanguageTool(
  text: string,
  language: string,
  signal?: AbortSignal,
): Promise<ProofreadingMatch[]> {
  const body = new URLSearchParams({
    text,
    language,
  })

  const response = await fetch(`${LANGUAGETOOL_PUBLIC_BASE_URL}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
    signal,
  })

  if (!response.ok) {
    throw new Error(`LanguageTool returned ${response.status}`)
  }

  const payload = (await response.json()) as LanguageToolResponse

  return payload.matches.map((match, index) => ({
    id: `${match.rule.id}-${match.offset}-${index}`,
    message: match.message,
    shortMessage: match.shortMessage ?? '',
    offset: match.offset,
    length: match.length,
    replacements: match.replacements.map((replacement) => replacement.value),
    contextText: match.context.text,
    contextOffset: match.context.offset,
    ruleId: match.rule.id,
    category: match.rule.category.name,
  }))
}
