/** Whole words, with punctuation as its own token. Not BERT pieces. */

const WORD = /[A-Za-z0-9]+(?:'[A-Za-z]+)?|[^\s\w]/g

export function tokenizeWords(text: string): string[] {
  return text.match(WORD) ?? []
}
