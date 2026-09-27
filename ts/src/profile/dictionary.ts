/**
 * A usage dictionary: each word, and the part-of-speech tags it takes in a text.
 * Build one from any input version 1 can read. Add another text onto it.
 * The JSON is the stored form. The guide and the difference report read it.
 */

import type { InputFile, AnnotatedSentence } from '../input/readInput.ts'
import { readInput } from '../input/readInput.ts'
import { splitSentences } from '../input/splitSentences.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import { tagLabel } from '../measures/syntax.ts'
import { observeArrangements } from './arrangements.ts'
import { alignedWords } from '../measures/joins.ts'
import type { Arrangement, DictionaryWord, NameEntry, StoredDictionary, UsageDictionary, WordUse } from '../types/card.ts'

const OPEN = new Set([
  'NN', 'NNS', 'NNP', 'NNPS', 'NOUN', 'PROPN',
  'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'VERB',
  'JJ', 'JJR', 'JJS', 'ADJ',
  'RB', 'RBR', 'RBS', 'ADV',
])

const SKIP_TAG = new Set(['PUNCT', 'SYM', '.', ',', ':', ';', '``', "''"])

export type DictionaryOptions = {
  /** When false, a text with no tags does not call the tagger. */
  tag?: boolean
  /** A dictionary to add this text onto. The original object is left as it was. */
  dictionary?: StoredDictionary
}

function article(name: string): string {
  return /^[aeiou]/i.test(name) ? 'an' : 'a'
}

function pairs(sentence: AnnotatedSentence): Array<{ word: string; tag: string }> {
  const tags = sentence.tags ?? []
  if (tags.length === 0) return []
  const words = sentence.words?.length
    ? sentence.words
    : tokenizeWords(sentence.text).filter((token) => /^[A-Za-z]/.test(token))
  const found: Array<{ word: string; tag: string }> = []
  const limit = Math.min(words.length, tags.length)
  for (let i = 0; i < limit; i++) {
    if (!/^[A-Za-z]/.test(words[i])) continue
    if (SKIP_TAG.has(tags[i])) continue
    found.push({ word: words[i].toLowerCase(), tag: tags[i] })
  }
  return found
}

function sortedUses(uses: WordUse[]): WordUse[] {
  return [...uses].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

function sortedWords(words: DictionaryWord[]): DictionaryWord[] {
  return [...words].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
}

/** Fold tagged sentences into a dictionary. Words with no tag are not invented. */
export function observeDictionary(sentences: AnnotatedSentence[], base: UsageDictionary = {}): UsageDictionary {
  const byWord = new Map<string, DictionaryWord>()
  for (const entry of base.words ?? []) {
    byWord.set(entry.word, {
      word: entry.word,
      count: entry.count,
      uses: entry.uses.map((use) => ({ ...use })),
    })
  }
  for (const sentence of sentences) {
    for (const pair of pairs(sentence)) {
      const current = byWord.get(pair.word) ?? { word: pair.word, count: 0, uses: [] }
      current.count += 1
      const use = current.uses.find((item) => item.tag === pair.tag)
      if (use) use.count += 1
      else current.uses.push({ tag: pair.tag, count: 1 })
      byWord.set(pair.word, current)
    }
  }
  const words = sortedWords([...byWord.values()].map((entry) => ({ ...entry, uses: sortedUses(entry.uses) })))
  const names = observeNames(sentences, base.names ?? [])
  return {
    ...(words.length > 0 ? { words } : {}),
    ...(names.length > 0 ? { names } : {}),
  }
}

const NAME_TAG = new Set(['PROPN', 'NNP', 'NNPS'])
const TITLES = new Set(['dr', 'mr', 'mrs', 'ms', 'prof', 'st'])

/** The words of a sentence in the case the writer used. The English tagger lowercases its words. */
function casedWords(sentence: AnnotatedSentence): string[] {
  const words = alignedWords(sentence)
  const tokens = tokenizeWords(sentence.text)
  let cursor = 0
  return words.map((word) => {
    for (let j = cursor; j < tokens.length; j++) {
      if (tokens[j].toLowerCase() === word.toLowerCase()) {
        cursor = j + 1
        return tokens[j]
      }
    }
    return word
  })
}

/** People and places, kept as written: a run of proper-noun tags, with a title such as Dr. joined on. */
export function namesIn(sentence: AnnotatedSentence): string[] {
  const tags = sentence.tags ?? []
  if (tags.length === 0) return []
  const words = casedWords(sentence)
  const found: string[] = []
  let run: string[] = []
  const close = () => {
    const real = run.filter((word) => word !== '.')
    if (real.length > 0 && !(real.length === 1 && TITLES.has(real[0].toLowerCase()))) {
      found.push(run.join(' ').replace(/ \./g, '.'))
    }
    run = []
  }
  for (let i = 0; i < Math.min(tags.length, words.length); i++) {
    const word = words[i]
    const previous = run[run.length - 1]
    if (word === '.' && previous && TITLES.has(previous.toLowerCase()) && NAME_TAG.has(tags[i + 1] ?? '')) {
      run.push('.')
      continue
    }
    if (NAME_TAG.has(tags[i]) && /^[A-Za-z]/.test(word)) {
      run.push(word)
      continue
    }
    close()
  }
  close()
  return found
}

function observeNames(sentences: AnnotatedSentence[], base: NameEntry[]): NameEntry[] {
  const counts = new Map<string, number>()
  for (const entry of base) counts.set(entry.name, entry.count)
  for (const sentence of sentences) {
    for (const name of namesIn(sentence)) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function splitDictionary(dictionary: UsageDictionary): { content: UsageDictionary; functional: UsageDictionary } {
  const content: DictionaryWord[] = []
  const functional: DictionaryWord[] = []
  for (const entry of dictionary.words ?? []) {
    const open = entry.uses.filter((use) => OPEN.has(use.tag))
    const closed = entry.uses.filter((use) => !OPEN.has(use.tag))
    if (open.length > 0) {
      const count = open.reduce((sum, use) => sum + use.count, 0)
      content.push({ word: entry.word, count, uses: sortedUses(open) })
    }
    if (closed.length > 0) {
      const count = closed.reduce((sum, use) => sum + use.count, 0)
      functional.push({ word: entry.word, count, uses: sortedUses(closed) })
    }
  }
  const names = dictionary.names ?? []
  return {
    content: {
      ...(content.length > 0 ? { words: sortedWords(content) } : {}),
      ...(names.length > 0 ? { names } : {}),
    },
    functional: functional.length === 0 ? {} : { words: sortedWords(functional) },
  }
}

const SUBJECT_TAG = new Set(['NN', 'NNS', 'NOUN', 'JJ', 'JJR', 'JJS', 'ADJ'])

/** Subject words: words used mostly as a common noun or an adjective. Names, adverbs, and verbs are left out. */
export function subjectWords(content: UsageDictionary): DictionaryWord[] {
  return sortedWords((content.words ?? []).filter((entry) => SUBJECT_TAG.has(sortedUses(entry.uses)[0]?.tag ?? '')))
}

/** The subject words a rewrite is asked to keep. The sheet shows these, and the repair names only these. */
export function keptSubjects(content: UsageDictionary): DictionaryWord[] {
  return listed(subjectWords(content), 2)
}

/** The lines that only apply when the reply keeps the source's subject: subject words and names. */
export function subjectGuide(content: UsageDictionary): string {
  const subjects = keptSubjects(content)
  const names = (content.names ?? []).slice(0, 8)
  const parts: string[] = []
  if (subjects.length > 0) {
    const bits = subjects.map((entry) => `${entry.word} is ${article(dominantUse(entry).split(',')[0])} ${dominantUse(entry)}`)
    parts.push(`Keep these subject words: ${bits.join('; ')}. They name what this text is about, in those roles.`)
  }
  if (names.length > 0) {
    parts.push(`Keep these names as written: ${names.map((entry) => entry.name).join(', ')}.`)
  }
  return parts.join(' ')
}

export function dominantUse(entry: DictionaryWord): string {
  const uses = sortedUses(entry.uses)
  if (uses.length === 0) return 'word'
  const first = tagLabel(uses[0].tag)
  if (uses.length === 1) return first
  const second = tagLabel(uses[1].tag)
  return `${first}, and also ${article(second)} ${second}`
}

function listed(words: DictionaryWord[] | undefined, floor: number): DictionaryWord[] {
  const ranked = sortedWords(words ?? [])
  const repeated = ranked.filter((entry) => entry.count >= floor)
  return (repeated.length > 0 ? repeated : ranked).slice(0, 8)
}

function paragraphTexts(prepared: Awaited<ReturnType<typeof readInput>>): string[] {
  if (prepared.chapters.length > 0) {
    const texts: string[] = []
    for (const chapter of prepared.chapters) {
      for (const section of chapter.sections) texts.push(...section.paragraphs)
    }
    return texts
  }
  return prepared.paragraphs
}

/** Paragraphs of sentences, so a chain can be labelled by the paragraph it came from. */
export function paragraphGroups(prepared: Awaited<ReturnType<typeof readInput>>): AnnotatedSentence[][] {
  const texts = paragraphTexts(prepared)
  const split = texts.map((text) => splitSentences(text))
  const total = split.reduce((count, sentences) => count + sentences.length, 0)
  if (prepared.sentences?.length && prepared.sentences.length !== total) return [prepared.sentences]
  if (prepared.sentences?.length) {
    let cursor = 0
    return split.map((sentences) => sentences.map(() => prepared.sentences![cursor++]))
  }
  return split.map((sentences) => sentences.map((text): AnnotatedSentence => ({ text })))
}

async function tagGroups(input: string | InputFile, options: DictionaryOptions): Promise<AnnotatedSentence[][]> {
  const prepared = await readInput(input)
  const groups = paragraphGroups(prepared)
  const tagged = groups.some((group) => group.some((sentence) => sentence.tags && sentence.tags.length > 0))
  if (tagged || options.tag === false) return groups
  const { annotate } = await import('./annotate.ts')
  const found: AnnotatedSentence[][] = []
  for (const group of groups) {
    const sentences: AnnotatedSentence[] = []
    for (const sentence of group) {
      const pieces = await annotate(sentence.text)
      sentences.push({
        text: sentence.text,
        tags: pieces.flatMap((item) => item.tags ?? []),
        words: pieces.flatMap((item) => item.words ?? []),
      })
    }
    found.push(sentences)
  }
  return found
}

function withArrangements(words: UsageDictionary, arrangements: Arrangement[]): StoredDictionary {
  return arrangements.length > 0 ? { ...words, arrangements } : words
}

/** Build a dictionary from a text. Pass `dictionary` to add this text onto one that already exists. */
export async function buildDictionary(
  input: string | InputFile,
  options: DictionaryOptions = {},
): Promise<StoredDictionary> {
  const groups = await tagGroups(input, options)
  const words = observeDictionary(groups.flat(), options.dictionary ?? {})
  const arrangements = observeArrangements(groups, options.dictionary?.arrangements ?? [])
  return withArrangements(words, arrangements)
}

/** Add a text onto a dictionary. Same as buildDictionary with that dictionary as the base. */
export async function addToDictionary(
  dictionary: StoredDictionary,
  input: string | InputFile,
  options: Omit<DictionaryOptions, 'dictionary'> = {},
): Promise<StoredDictionary> {
  return buildDictionary(input, { ...options, dictionary })
}

export function dictionaryToJson(dictionary: StoredDictionary): string {
  return JSON.stringify(dictionary)
}

export function dictionaryFromJson(json: string): StoredDictionary {
  const parsed = JSON.parse(json) as StoredDictionary
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('gras_to_text: dictionary JSON needs a words list')
  }
  const keys = Object.keys(parsed)
  const known = keys.every((key) => key === 'words' || key === 'arrangements' || key === 'names')
  if (!known || (parsed.words === undefined && parsed.arrangements === undefined && parsed.names === undefined && keys.length > 0)) {
    throw new Error('gras_to_text: dictionary JSON needs a words list')
  }
  if (parsed.words !== undefined && !Array.isArray(parsed.words)) {
    throw new Error('gras_to_text: dictionary JSON needs a words list')
  }
  if (parsed.names !== undefined && !Array.isArray(parsed.names)) {
    throw new Error('gras_to_text: dictionary JSON needs a words list')
  }
  if (parsed.arrangements !== undefined && !Array.isArray(parsed.arrangements)) {
    throw new Error('gras_to_text: dictionary JSON needs a words list')
  }
  return withArrangements(observeDictionary([], parsed), observeArrangements([], parsed.arrangements ?? []))
}
