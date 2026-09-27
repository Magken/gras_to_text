/** Join BERT WordPiece pieces back onto the whole word. The tag stays the tag of the first piece. */

export type WordPiece = {
  word: string
  tag: string
}

export function glueWordPieces(pieces: WordPiece[]): WordPiece[] {
  const words: WordPiece[] = []
  for (const piece of pieces) {
    if (piece.word.startsWith('##') && words.length > 0) {
      words[words.length - 1].word += piece.word.slice(2)
      continue
    }
    words.push({ word: piece.word, tag: piece.tag })
  }
  return words
}
