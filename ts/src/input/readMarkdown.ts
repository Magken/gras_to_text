/** Markdown headings become chapters and sections. Body text stays paragraphs. */

import { splitParagraphs } from './splitParagraphs.ts'
import type { ChapterNode, TextStructure } from './readStructure.ts'

export function readMarkdown(text: string): TextStructure {
  const chapters: ChapterNode[] = []
  const paragraphs: string[] = []
  let chapter: ChapterNode | null = null
  let section: { title: string; paragraphs: string[] } | null = null
  let buffer: string[] = []

  function flush(): void {
    const chunk = buffer.join('\n').trim()
    buffer = []
    if (!chunk) return
    const parts = splitParagraphs(chunk)
    if (section) section.paragraphs.push(...parts)
    else if (chapter) chapter.sections.push({ title: '', paragraphs: parts })
    else paragraphs.push(...parts)
  }

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const heading = /^(#{1,6})\s+(\S.*)$/.exec(line)
    if (!heading) {
      buffer.push(line)
      continue
    }
    flush()
    const depth = heading[1].length
    const title = heading[2].trim()
    if (depth === 1) {
      chapter = { title, sections: [] }
      section = null
      chapters.push(chapter)
      continue
    }
    if (!chapter) {
      chapter = { title: '', sections: [] }
      chapters.push(chapter)
    }
    section = { title, paragraphs: [] }
    chapter.sections.push(section)
  }
  flush()
  return { chapters, paragraphs }
}
