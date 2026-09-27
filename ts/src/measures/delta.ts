/** Rates of a fixed filler-word list, including the, of, and upon. */

const FUNCTION_WORDS = [
  'the',
  'of',
  'and',
  'to',
  'a',
  'in',
  'that',
  'upon',
  'whilst',
  'by',
  'from',
] as const

/**
 * Share of all words in ordinary edited English prose, from the Brown corpus counts
 * (Kučera and Francis, 1967). The sheet states a source rate against these, because a
 * writer told only "the about 3 in 100" writes its own habit of about 7.
 */
export const PROSE_RATES: Record<(typeof FUNCTION_WORDS)[number], number> = {
  the: 0.069,
  of: 0.036,
  and: 0.028,
  to: 0.026,
  a: 0.023,
  in: 0.021,
  that: 0.010,
  upon: 0.0005,
  whilst: 0.00001,
  by: 0.0052,
  from: 0.0043,
}

function isWord(token: string): boolean {
  return /^[A-Za-z]/.test(token)
}

export function functionWordRates(tokens: string[]): Record<string, number> {
  const words = tokens.filter(isWord)
  const counts = Object.fromEntries(FUNCTION_WORDS.map((word) => [word, 0]))
  for (const token of words) {
    const word = token.toLowerCase()
    if (word in counts) counts[word] += 1
  }
  const total = words.length
  const rates: Record<string, number> = {}
  for (const word of FUNCTION_WORDS) {
    rates[word] = total === 0 ? 0 : counts[word] / total
  }
  return rates
}
