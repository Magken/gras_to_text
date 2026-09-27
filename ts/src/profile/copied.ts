/**
 * Phrases a reply lifted from the source sentences the sheet shows. A writer given
 * example sentences tends to reuse their words; the sheet asks for the build only.
 * A phrase is four or more words in a row, shared with a shown sentence, with at
 * least two content words in it, so a common frame such as "the colour of the"
 * does not count and "set them down too hard" does.
 */

import { splitSentences } from '../input/splitSentences.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import type { TextProfile } from '../types/card.ts'

/** Shortest run of shared words that counts as a copied phrase. */
export const COPY_LENGTH = 4

const GLUE = new Set([
  'the', 'a', 'an', 'and', 'but', 'or', 'so', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'from', 'with', 'as', 'that',
  'this', 'it', 'its', 'he', 'she', 'they', 'them', 'his', 'her', 'their', 'him', 'we', 'you', 'i', 'was', 'were', 'is',
  'be', 'been', 'had', 'has', 'have', 'did', 'do', 'not', 'if', 'then', 'there', 'what', 'who', 'which', 'when', 'one',
  'all', 'no', 'up', 'out', 'down', 'into', 'over', 'upon', 'would', 'could', 'might', 'will', 'too', 'very', 'just',
  'more', 'than', 'some', 'any', 'each', 'these', 'those', 'my', 'me', 'our', 'us', 'are', 'am', 'can', 'may', 'must',
  'should', 'again', 'only', 'even', 'also', 'how', 'why', 'where', 'said', 'say', 'says',
  'came', 'come', 'went', 'go', 'got', 'get', 'made', 'make', 'knew', 'know', 'took', 'take', 'gave', 'give', 'saw',
  'see', 'put', 'both', 'other', 'such', 'own', 'about', 'back', 'off', 'never', 'still', 'now',
])

export function isGlue(word: string): boolean {
  return GLUE.has(word.toLowerCase())
}

/** Content words a shared run needs before it counts as copied. */
const CONTENT_FLOOR = 2

function wordsOf(text: string): string[] {
  return tokenizeWords(text).filter((token) => /^[A-Za-z0-9]/.test(token)).map((token) => token.toLowerCase())
}

/** Every source sentence the rendered sheet can show: excerpts, shape examples, the paragraph closer. */
export function shownText(card: TextProfile): string[] {
  const shown: string[] = []
  for (const step of card.guide) {
    shown.push(step.text)
    if (step.excerpt) shown.push(step.excerpt)
  }
  for (const shape of card.syntactic.arrangements ?? []) shown.push(shape.example)
  return shown
}

/** The phrases of `reply` that also appear in `shown`, longest runs merged, in reply order. */
export function copiedPhrases(reply: string, shown: string[]): string[] {
  const grams = new Set<string>()
  for (const text of shown) {
    const words = wordsOf(text)
    for (let i = 0; i + COPY_LENGTH <= words.length; i++) grams.add(words.slice(i, i + COPY_LENGTH).join(' '))
  }
  const words = wordsOf(reply)
  const hit = new Array<boolean>(words.length).fill(false)
  for (let i = 0; i + COPY_LENGTH <= words.length; i++) {
    if (!grams.has(words.slice(i, i + COPY_LENGTH).join(' '))) continue
    for (let j = i; j < i + COPY_LENGTH; j++) hit[j] = true
  }
  const phrases: string[] = []
  let run: string[] = []
  for (let i = 0; i <= words.length; i++) {
    if (i < words.length && hit[i]) {
      run.push(words[i])
      continue
    }
    if (run.filter((word) => !GLUE.has(word)).length >= CONTENT_FLOOR) phrases.push(run.join(' '))
    run = []
  }
  return [...new Set(phrases)]
}

/** The source's first sentence: the one a writer sees first on the sheet. */
export function sourceOpening(card: TextProfile): string {
  const first = card.guide.find((step) => step.excerpt)?.excerpt ?? ''
  return splitSentences(first)[0] ?? ''
}

/** The reply's first sentence when it opens on the same three words as the source's first sentence. */
export function echoedOpening(reply: string, opening: string): string | null {
  const first = splitSentences(reply)[0] ?? ''
  const head = wordsOf(first).slice(0, 3).join(' ')
  const source = wordsOf(opening).slice(0, 3).join(' ')
  return source.split(' ').length === 3 && head === source ? first : null
}

/** Shortest sentence, in words, whose frame can count as copied. */
export const FRAME_LENGTH = 5

/** A sentence with each content word blanked: "the first column was the hour" -> "the * * was the *". */
function frameOf(words: string[]): string {
  return words.map((word) => (GLUE.has(word) ? word : '*')).join(' ')
}

/**
 * Reply sentences that copy a shown sentence's frame: the same glue words in the same
 * places, the content words swapped, and at least one content word kept in its place.
 * "The first mark was the weight." copies "The first column was the hour."; "The old
 * man was the king." has the frame but keeps no word, so it does not count.
 */
export function copiedFrames(reply: string, shown: string[]): { reply: string, source: string }[] {
  const frames = new Map<string, { words: string[], source: string }[]>()
  for (const text of shown) {
    for (const sentence of splitSentences(text)) {
      const words = wordsOf(sentence)
      const glue = words.filter((word) => GLUE.has(word)).length
      if (words.length < FRAME_LENGTH || glue < 2 || glue === words.length) continue
      const frame = frameOf(words)
      frames.set(frame, [...(frames.get(frame) ?? []), { words, source: sentence }])
    }
  }
  const found: { reply: string, source: string }[] = []
  for (const sentence of splitSentences(reply)) {
    const words = wordsOf(sentence)
    const match = frames.get(frameOf(words))?.find((item) =>
      item.words.some((word, i) => !GLUE.has(word) && words[i] === word) && item.words.join(' ') !== words.join(' '))
    if (match) found.push({ reply: sentence, source: match.source })
  }
  return found
}
