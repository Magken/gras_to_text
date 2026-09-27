/** A raw paste or a JSON document, with empty levels left empty. */

import { splitParagraphs } from './splitParagraphs.ts'

export type SectionNode = {
  title: string
  paragraphs: string[]
}

export type ChapterNode = {
  title: string
  sections: SectionNode[]
}

export type TextStructure = {
  chapters: ChapterNode[]
  paragraphs: string[]
}

type StructuredInput = {
  chapters?: ChapterNode[]
  paragraphs?: string[]
}

function fromObject(input: StructuredInput): TextStructure {
  return {
    chapters: input.chapters ?? [],
    paragraphs: input.paragraphs ?? [],
  }
}

export function readStructure(input: string | StructuredInput): TextStructure {
  if (typeof input !== 'string') return fromObject(input)
  const trimmed = input.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as StructuredInput
      if (parsed && typeof parsed === 'object') return fromObject(parsed)
    } catch {
      // A raw paste may contain a brace. Treat it as text.
    }
  }
  return { chapters: [], paragraphs: splitParagraphs(input) }
}
