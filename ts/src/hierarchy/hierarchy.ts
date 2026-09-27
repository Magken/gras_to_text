/** Roll a lower level up only when that level is present. */

export type SentenceShape = {
  wordCount: number
  startTag: string | null
}

export type ParagraphShape = {
  sentenceCount: number
  meanWords: number
  openingStartTag: string | null
}

export type SectionShape = {
  paragraphCount: number
  meanSentences: number
}

export function paragraphShape(sentences: SentenceShape[]): ParagraphShape | null {
  if (sentences.length === 0) return null
  const meanWords = sentences.reduce((sum, sentence) => sum + sentence.wordCount, 0) / sentences.length
  return {
    sentenceCount: sentences.length,
    meanWords,
    openingStartTag: sentences[0].startTag,
  }
}

export function sectionShape(paragraphs: ParagraphShape[]): SectionShape | null {
  if (paragraphs.length === 0) return null
  const meanSentences =
    paragraphs.reduce((sum, paragraph) => sum + paragraph.sentenceCount, 0) / paragraphs.length
  return { paragraphCount: paragraphs.length, meanSentences }
}
