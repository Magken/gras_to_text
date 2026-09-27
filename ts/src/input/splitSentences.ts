/**
 * Sentences end at . ! ? unless the period closes an abbreviation. A closing quote or bracket
 * after the mark stays with the sentence; a speech tag in lower case after it does too.
 */

const CLOSERS = new Set(['”', '"', '’', ')', ']'])

const ABBREVIATIONS = new Set([
  'dr',
  'mr',
  'mrs',
  'ms',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
])

export function splitSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const sentences: string[] = []
  let start = 0
  for (let i = 0; i < trimmed.length; i++) {
    const mark = trimmed[i]
    if (mark !== '.' && mark !== '!' && mark !== '?') continue
    if (mark === '.') {
      const word = trimmed.slice(start, i).match(/([A-Za-z]+)$/)?.[1]?.toLowerCase() ?? ''
      if (ABBREVIATIONS.has(word)) continue
    }
    let end = i
    while (CLOSERS.has(trimmed[end + 1] ?? '')) end += 1
    const next = trimmed[end + 1]
    if (next !== undefined && next !== ' ' && next !== '\n') continue
    if (end > i && /^\s*[a-z]/.test(trimmed.slice(end + 1))) continue
    const sentence = trimmed.slice(start, end + 1).trim()
    if (sentence) sentences.push(sentence)
    start = end + 1
    i = end
  }
  const rest = trimmed.slice(start).trim()
  if (rest) sentences.push(rest)
  return sentences
}
