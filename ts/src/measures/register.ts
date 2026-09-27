/**
 * Register: how formal the words are. Two measures, both on every word of the text,
 * not only the starter filler list: the share of long words (three or more syllables),
 * and marked words, older or formal or informal, from a fixed list.
 */

import type { MarkedWord, Register } from '../types/card.ts'

const KINDS: Record<string, string[]> = {
  'an older, formal word': [
    'upon', 'whilst', 'amongst', 'amidst', 'unto', 'thus', 'hence', 'thence', 'whence', 'wherein', 'whereby',
    'thereby', 'therein', 'hitherto', 'henceforth', 'ere', 'oft', 'lest', 'albeit', 'perchance', 'shall', 'whom',
  ],
  'a formal linking word': [
    'moreover', 'furthermore', 'nevertheless', 'nonetheless', 'notwithstanding', 'accordingly', 'consequently', 'therefore',
  ],
  'an informal word': ['gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'yeah', 'okay', 'ok', 'stuff', 'guys'],
}

const KIND_OF = new Map(Object.entries(KINDS).flatMap(([kind, words]) => words.map((word) => [word, kind] as const)))

export function markedKind(word: string): string | undefined {
  return KIND_OF.get(word.toLowerCase())
}

/**
 * Syllables by vowel groups. A silent final e is dropped, and so is the e of a final -ed
 * unless t or d comes before it (answered, but wanted). Good enough to sort short from long words.
 */
export function syllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '')
  if (lower.length === 0) return 0
  const unvoiced = lower.length > 4 && /[^aeiouytd]ed$/.test(lower) ? `${lower.slice(0, -2)}d` : lower
  const trimmed = unvoiced.length > 3 && /[^l]e$/.test(unvoiced) ? unvoiced.slice(0, -1) : unvoiced
  return Math.max(1, trimmed.match(/[aeiouy]+/g)?.length ?? 1)
}

/** Long-word share, the long words most repeated (minus `exclude`), and the marked words found. */
export function registerOf(tokens: string[], exclude: Set<string> = new Set()): Register {
  const words = tokens.filter((token) => /^[A-Za-z]/.test(token)).map((token) => token.toLowerCase())
  const longCounts = new Map<string, number>()
  const marked = new Map<string, number>()
  let long = 0
  for (const word of words) {
    if (syllables(word) >= 3) {
      long += 1
      if (!exclude.has(word)) longCounts.set(word, (longCounts.get(word) ?? 0) + 1)
    }
    if (KIND_OF.has(word)) marked.set(word, (marked.get(word) ?? 0) + 1)
  }
  return {
    long: words.length > 0 ? long / words.length : 0,
    longWords: [...longCounts.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([word]) => word),
    marked: [...marked.entries()]
      .map(([word, count]): MarkedWord => ({ word, count, kind: KIND_OF.get(word)! }))
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)),
  }
}

function oneIn(share: number): string {
  if (share <= 0) return 'no word'
  const every = Math.round(1 / share)
  return every <= 1 ? 'nearly every word' : `about 1 word in ${every}`
}

/** The register lines of the word step. */
export function registerGuide(register: Register | undefined): string {
  if (!register) return ''
  const parts: string[] = []
  const byKind = new Map<string, string[]>()
  for (const item of register.marked) byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item.word])
  for (const [kind, words] of byKind) {
    const list = words.slice(0, 4)
    const plural = list.length > 1
    const joined = plural ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0]
    const kindText = plural ? kind.replace(/^an? /, '').replace(/word$/, 'words') : kind
    parts.push(
      kind === 'an informal word'
        ? `${joined} ${plural ? 'are' : 'is'} ${kindText}; the source uses ${plural ? 'them' : 'it'}, so the reply may too.`
        : `${joined} ${plural ? 'are' : 'is'} ${kindText}; the source uses ${plural ? 'them' : 'it'}, so keep ${plural ? 'them' : 'it'}, about as often as the source does.`,
    )
  }
  if (register.longWords.length > 0 && register.long >= 0.05) {
    parts.push(
      `${oneIn(register.long)[0].toUpperCase()}${oneIn(register.long).slice(1)} has three syllables or more, such as ${register.longWords.join(', ')}. Keep that level: do not swap them for short plain words, and do not add more.`,
    )
  }
  return parts.join(' ')
}

export function registerShare(share: number): string {
  return oneIn(share)
}
