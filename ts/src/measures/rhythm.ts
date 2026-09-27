/** Sentence-length quartiles, in words, and how often a long sentence is followed by a short one. */

import { tokenizeWords } from '../input/tokenizeWords.ts'

export type Rhythm = {
  q1: number
  q2: number
  q3: number
  /** Share of long sentences (q3 or more) followed at once by a short one (q1 or fewer). */
  afterLong: number
  /** Median length of sentences in quoted speech, when at least 5 sentences and 2 in 10 are spoken. */
  spoken?: number
}

function wordCount(sentence: string): number {
  return tokenizeWords(sentence).filter((token) => /^[A-Za-z0-9]/.test(token)).length
}

function quartile(sorted: number[], portion: number): number {
  if (sorted.length === 0) return 0
  const index = (sorted.length - 1) * portion
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function sentenceRhythm(sentences: string[]): Rhythm {
  const inOrder = sentences.map(wordCount)
  const lengths = [...inOrder].sort((a, b) => a - b)
  const q1 = quartile(lengths, 0.25)
  const q3 = quartile(lengths, 0.75)
  const spoken = spokenLengths(sentences).sort((a, b) => a - b)
  const measured = spoken.length >= 5 && spoken.length >= sentences.length * 0.2
  return { q1, q2: quartile(lengths, 0.5), q3, afterLong: afterLongShare(inOrder, q1, q3), ...(measured ? { spoken: quartile(spoken, 0.5) } : {}) }
}

/** Whether each sentence is inside quoted speech. A quote left open carries on into the next sentence. */
export function spokenFlags(sentences: string[]): boolean[] {
  let open = false
  return sentences.map((sentence) => {
    const marks = sentence.match(/["“”]/g) ?? []
    const spoken = open || marks.length > 0
    for (const mark of marks) open = mark === '“' ? true : mark === '”' ? false : !open
    return spoken
  })
}

/** Lengths of the sentences inside quoted speech. */
export function spokenLengths(sentences: string[]): number[] {
  const flags = spokenFlags(sentences)
  return sentences.filter((_, i) => flags[i]).map(wordCount)
}

export function afterLongShare(lengths: number[], q1: number, q3: number): number {
  let longs = 0
  let short = 0
  for (let i = 0; i < lengths.length - 1; i++) {
    if (lengths[i] < q3) continue
    longs += 1
    if (lengths[i + 1] <= q1) short += 1
  }
  return longs === 0 ? 0 : short / longs
}
