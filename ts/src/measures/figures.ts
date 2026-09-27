/**
 * Three habits of a voice that the counts above do not see, each read from the words alone:
 * a clause that picks up the last word of the one before ("on Thursday, and Thursday was not"),
 * a statement followed by a second reading of it ("a kindness, or it was fatigue"), and a short
 * general maxim in the present tense ("A plain order can be kept.").
 */

import { isGlue } from '../profile/copied.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import { spokenFlags } from './rhythm.ts'
import type { Figures } from '../types/card.ts'

function wordsOf(text: string): string[] {
  return tokenizeWords(text).filter((token) => /^[A-Za-z]/.test(token)).map((token) => token.toLowerCase())
}

function content(word: string): boolean {
  return word.length >= 4 && !isGlue(word)
}

/** Clause edges within a sentence: ", and", ", but", ", so", ", or", and ";". */
const CLAUSE_BREAK = /,\s+(?:and|but|so|or)\s+|;\s*/i

/** A content word from the last three words of one clause, again in the first three of the next. */
export function picksUp(before: string, after: string): string | null {
  const tail = wordsOf(before).slice(-3).filter(content)
  const head = wordsOf(after).slice(0, 3)
  return tail.find((word) => head.includes(word)) ?? null
}

/** Within one sentence only: a word picked up from the sentence before is ordinary cohesion. */
export function chains(sentence: string): boolean {
  const clauses = sentence.split(CLAUSE_BREAK)
  for (let i = 1; i < clauses.length; i++) if (picksUp(clauses[i - 1], clauses[i])) return true
  return false
}

const REREAD = /,\s+or\s+(?:(?:it|he|she|they|this|that)\s+(?:was|were|is|are|had|did|may|might)|else|perhaps)\b/i

export function rereads(sentence: string): boolean {
  return REREAD.test(sentence)
}

const GENERIC_OPEN = /^(?:a|an|every|no|nothing|everything|anything|something|most|all|people|nobody|anyone|whoever)\b/i
const PRESENT = /\b(?:is|are|can|will|does|do|has|have|must|keeps|comes|goes|needs|makes|takes|tells|knows)\b/i
const PAST_OR_PERSON = /\b(?:was|were|had|did|i|you|we|he|she|they|my|your|his|her|their)\b/i

export function isMaxim(sentence: string): boolean {
  if (/["“”]/.test(sentence)) return false
  const count = wordsOf(sentence).length
  return count >= 3 && count <= 10 && GENERIC_OPEN.test(sentence.trim()) && PRESENT.test(sentence) && !PAST_OR_PERSON.test(sentence)
}

/** A share of sentences as a count a writer can hold: "about once in 100 sentences". */
export function perHundred(share: number): string {
  const count = Math.max(1, Math.round(share * 100))
  return `about ${count === 1 ? 'once' : `${count} times`} in 100 sentences`
}

/** Share of sentences with each habit, and the first source sentence that shows it. */
export function figureRates(sentences: string[]): Figures {
  const count = Math.max(sentences.length, 1)
  const found = { chain: [] as string[], reread: [] as string[], maxim: [] as string[] }
  const spoken = spokenFlags(sentences)
  sentences.forEach((sentence, i) => {
    if (chains(sentence)) found.chain.push(sentence)
    if (rereads(sentence)) found.reread.push(sentence)
    if (!spoken[i] && isMaxim(sentence)) found.maxim.push(sentence)
  })
  return {
    chain: found.chain.length / count,
    reread: found.reread.length / count,
    maxim: found.maxim.length / count,
    examples: {
      ...(found.chain[0] ? { chain: found.chain[0] } : {}),
      ...(found.reread[0] ? { reread: found.reread[0] } : {}),
      ...(found.maxim[0] ? { maxim: found.maxim[0] } : {}),
    },
  }
}
