/**
 * One input function for the kinds version 1 can read.
 * Plain text, JSON (including tags someone already added), Markdown, PDF, and Word.
 */

import { readFileSync, existsSync } from 'node:fs'
import { extname } from 'node:path'
import { readDocx } from './readDocx.ts'
import { readMarkdown } from './readMarkdown.ts'
import { readPdf } from './readPdf.ts'
import { readStructure, type ChapterNode, type TextStructure } from './readStructure.ts'
import { splitParagraphs } from './splitParagraphs.ts'

export type InputKind = 'text' | 'json' | 'markdown' | 'pdf' | 'docx'

export type AnnotatedSentence = {
  text: string
  tags?: string[]
  words?: string[]
}

export type AnnotatedParagraph = {
  text: string
  sentences?: AnnotatedSentence[]
}

export type PreparedText = {
  kind: InputKind
  chapters: ChapterNode[]
  paragraphs: string[]
  sentences: AnnotatedSentence[] | null
}

export type InputFile = {
  kind?: InputKind
  text?: string
  path?: string
  data?: Uint8Array
  chapters?: ChapterNode[]
  paragraphs?: Array<string | AnnotatedParagraph>
}

const EXTENSIONS: Record<string, InputKind> = {
  '.txt': 'text',
  '.json': 'json',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.pdf': 'pdf',
  '.docx': 'docx',
}

function sentencesFrom(paragraphs: Array<string | AnnotatedParagraph> | undefined): AnnotatedSentence[] | null {
  if (!paragraphs?.some((paragraph) => typeof paragraph !== 'string')) return null
  const sentences: AnnotatedSentence[] = []
  for (const paragraph of paragraphs) {
    if (typeof paragraph === 'string') continue
    if (paragraph.sentences) sentences.push(...paragraph.sentences)
    else sentences.push({ text: paragraph.text })
  }
  return sentences
}

function asStructure(input: InputFile): TextStructure {
  const paragraphs = (input.paragraphs ?? []).map((paragraph) =>
    typeof paragraph === 'string' ? paragraph : paragraph.text,
  )
  return readStructure({ chapters: input.chapters, paragraphs })
}

function fromText(kind: InputKind, text: string): PreparedText {
  if (kind === 'json') {
    let sentences: AnnotatedSentence[] | null = null
    let chapters: ChapterNode[] = []
    let paragraphs: string[] = []
    try {
      const parsed = JSON.parse(text) as InputFile
      const structure = asStructure(parsed)
      chapters = structure.chapters
      paragraphs = structure.paragraphs
      sentences = sentencesFrom(parsed.paragraphs)
    } catch {
      const structure = readStructure(text)
      chapters = structure.chapters
      paragraphs = structure.paragraphs
    }
    return { kind, chapters, paragraphs, sentences }
  }
  if (kind === 'markdown') {
    const structure = readMarkdown(text)
    return { kind, ...structure, sentences: null }
  }
  return { kind: 'text', chapters: [], paragraphs: splitParagraphs(text), sentences: null }
}

function detectTextKind(text: string): InputKind {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (parsed && typeof parsed === 'object') return 'json'
    } catch {
      // A brace in a paste is still plain text.
    }
  }
  if (/^#{1,6}\s+\S/m.test(text)) return 'markdown'
  return 'text'
}

function kindFromPath(file: string): InputKind {
  const kind = EXTENSIONS[extname(file).toLowerCase()]
  if (!kind) throw new Error(`gras_to_text: no reader for ${extname(file) || 'that file'}`)
  return kind
}

export async function readInput(input: string | InputFile): Promise<PreparedText> {
  if (typeof input === 'string') {
    const single = !input.includes('\n') && !input.includes(' ')
    if (single && existsSync(input) && extname(input)) return readInput({ path: input })
    return fromText(detectTextKind(input), input)
  }
  if (input.data && (input.kind === 'pdf' || input.kind === 'docx' || input.path)) {
    const kind = input.kind ?? (input.path ? kindFromPath(input.path) : undefined)
    if (kind === 'pdf' || kind === 'docx') return readBinary(kind, input.data)
  }
  if (input.path && input.text === undefined && input.chapters === undefined && input.paragraphs === undefined) {
    const kind = input.kind ?? kindFromPath(input.path)
    if (kind === 'pdf' || kind === 'docx') return readBinary(kind, new Uint8Array(readFileSync(input.path)))
    return fromText(kind, readFileSync(input.path, 'utf8'))
  }
  if (input.kind === 'markdown' && input.text !== undefined) return fromText('markdown', input.text)
  if (input.kind === 'text' && input.text !== undefined) return fromText('text', input.text)
  if (input.kind === 'json' && input.text !== undefined) return fromText('json', input.text)
  if (input.chapters || input.paragraphs) {
    const structure = asStructure(input)
    return {
      kind: 'json',
      chapters: structure.chapters,
      paragraphs: structure.paragraphs,
      sentences: sentencesFrom(input.paragraphs),
    }
  }
  if (input.text !== undefined) return fromText(input.kind ?? detectTextKind(input.text), input.text)
  throw new Error('gras_to_text: input needs text, a file path, or a JSON document')
}

async function readBinary(kind: 'pdf' | 'docx', data: Uint8Array): Promise<PreparedText> {
  const text = kind === 'pdf' ? await readPdf(data) : await readDocx(data)
  return { kind, chapters: [], paragraphs: splitParagraphs(text), sentences: null }
}
