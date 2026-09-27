/**
 * Arrangement dictionary: sentence shapes, not a percentage of each tag.
 * A shape is how a sentence opens (its first three tags) plus how it is built:
 * one clause, two clauses joined with and, a clause hung on because or that,
 * or no main verb. Each shape keeps one real sentence from the source.
 * A shape is labelled by the nouns of its paragraphs only when it sits in a
 * few paragraphs; a shape spread across the whole text has no topic.
 */

import type { AnnotatedSentence } from '../input/readInput.ts'
import { alignedWords, sentenceBuild } from '../measures/joins.ts'
import { tagLabel } from '../measures/syntax.ts'
import type { Arrangement, SentenceType } from '../types/card.ts'

/** How many opening tags name a shape. */
export const OPENING_LENGTH = 3

const COMMON_NOUNS = new Set(['NN', 'NNS', 'NOUN'])

const SKIP_TAG = new Set(['PUNCT', 'SYM', '.', ',', ':', ';', '``', "''"])

const NAME_TAG = new Set(['PROPN', 'NNP', 'NNPS'])

const OPENINGS: Array<[string, string]> = [
  ['determiner then noun then verb', 'Open by naming the thing, then say what it did.'],
  ['determiner then noun then auxiliary', 'Open by naming the thing, then put was, had, or did before what it did.'],
  ['determiner then adjective then noun', 'Open on a quality of the thing before the thing itself.'],
  ['determiner then noun then preposition', 'Open on the thing and where it sits before the verb.'],
  ['determiner then noun then noun', 'Open on a thing named by two nouns.'],
  ['pronoun then verb', 'Open on someone already named, and go straight to what they did.'],
  ['pronoun then auxiliary', 'Open on someone already named, then put was, had, or did before the act.'],
  ['name then verb', 'Open on a person by name, then say what they did.'],
  ['name then auxiliary', 'Open on a person by name, then put was, had, or did before the act.'],
  ['preposition then determiner then noun', 'Open on a place, a time, or a relation before the subject.'],
  ['adverb', 'Open on when or how it happened.'],
  ['conjunction', 'Open by tying this sentence back to the last one.'],
  ['number', 'Open on a number or an order.'],
]

const FIRST: Record<string, string> = {
  determiner: 'Open by naming the thing.',
  name: 'Open straight on a name.',
  noun: 'Open on the thing itself, with no the or a.',
  pronoun: 'Open on someone already named.',
  preposition: 'Open on a place, a time, or a relation before the subject.',
  adjective: 'Open on a quality before the thing.',
  verb: 'Open on the action.',
  auxiliary: 'Open on the helper verb.',
}

const BUILT: Record<SentenceType, string> = {
  simple: 'Keep it to one clause.',
  compound: 'Then join a second clause with and, but, or so.',
  complex: 'Then hang a clause on because, as, if, that, or who.',
  fragment: 'Leave out the main verb.',
}

/** The word after a two-slot opening, so shapes that share the first two slots read differently. */
const NEXT: Record<string, string> = {
  determiner: 'The next word is the, a, or this.',
  pronoun: 'The next word is a pronoun, such as you, him, or it.',
  particle: 'The next word is not or to.',
  adjective: 'The next word is a quality, such as glad or sure.',
  adverb: 'The next word says how or when, such as never or still.',
  verb: 'The next word is the main verb.',
  preposition: 'The next word is a preposition, such as in, to, or of.',
  noun: 'The next word names a thing.',
}

function openingMeaning(chain: string, tags: string[]): string {
  for (const [prefix, gloss] of OPENINGS) {
    if (chain === prefix || chain.startsWith(`${prefix} then`) || chain.startsWith(prefix)) {
      const slots = chain.split(' then ')
      const next = prefix.split(' then ').length === 2 && slots.length === 3 ? NEXT[slots[2]] : undefined
      return next ? `${gloss} ${next}` : gloss
    }
  }
  return FIRST[slotLabel(tags[0] ?? '')] ?? 'Open this way.'
}

function slotLabel(tag: string): string {
  return NAME_TAG.has(tag) ? 'name' : tagLabel(tag)
}

export function shapeMeaning(chain: string, tags: string[], type: SentenceType): string {
  return `${openingMeaning(chain, tags)} ${BUILT[type]}`
}

/** The first tags of a sentence, punctuation left out. A title and name such as Mr. Pell fill one slot. */
function openingTags(sentence: AnnotatedSentence): string[] {
  const tags = sentence.tags ?? []
  const words = alignedWords(sentence)
  const aligned = words.length === tags.length
  const opening: string[] = []
  for (let i = 0; i < tags.length && opening.length < OPENING_LENGTH; i++) {
    const tag = tags[i]
    if (SKIP_TAG.has(tag)) continue
    if (aligned && !/[A-Za-z0-9]/.test(words[i])) continue
    if (NAME_TAG.has(tag) && NAME_TAG.has(opening[opening.length - 1] ?? '')) continue
    opening.push(tag)
  }
  return opening
}

function chainOf(tags: string[]): string {
  return tags.map(slotLabel).join(' then ')
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length
}

function readable(text: string): boolean {
  const count = wordCount(text)
  return count >= 5 && count <= 28
}

function topicsOf(sentences: AnnotatedSentence[]): string[] {
  const counts = new Map<string, number>()
  for (const sentence of sentences) {
    const tags = sentence.tags ?? []
    const words = alignedWords(sentence)
    const limit = Math.min(words.length, tags.length)
    for (let i = 0; i < limit; i++) {
      if (!COMMON_NOUNS.has(tags[i]) || !/^[A-Za-z]/.test(words[i])) continue
      const word = words[i].toLowerCase()
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([word]) => word)
}

type Acc = {
  chain: string
  tags: string[]
  type: SentenceType
  count: number
  example: string
  topics: Map<string, number>
  paragraphs: Set<number>
  opens: number
  closes: number
}

function keyOf(chain: string, type: SentenceType): string {
  return `${type}|${chain}`
}

/** Count the sentence shapes in these paragraphs. Pass earlier shapes to add this text onto them. */
export function observeArrangements(groups: AnnotatedSentence[][], base: Arrangement[] = []): Arrangement[] {
  const fresh = groups.some((group) => group.length > 0)
  const byKey = new Map<string, Acc>()
  for (const item of base) {
    const type = item.type ?? 'simple'
    const topics = new Map<string, number>()
    for (const topic of item.topics ?? []) topics.set(topic, 1)
    byKey.set(keyOf(item.chain, type), {
      chain: item.chain,
      tags: item.tags,
      type,
      count: item.count,
      example: item.example ?? '',
      topics,
      paragraphs: fresh ? new Set() : new Set(item.paragraphs),
      opens: item.opens ?? 0,
      closes: item.closes ?? 0,
    })
  }
  groups.forEach((sentences, index) => {
    const paragraph = index + 1
    const topics = topicsOf(sentences)
    sentences.forEach((sentence, position) => {
      const build = sentenceBuild(sentence)
      const opening = openingTags(sentence)
      if (!build || opening.length === 0) return
      const chain = chainOf(opening)
      const key = keyOf(chain, build.type)
      const acc = byKey.get(key) ?? {
        chain,
        tags: opening,
        type: build.type,
        count: 0,
        example: '',
        topics: new Map<string, number>(),
        paragraphs: new Set<number>(),
        opens: 0,
        closes: 0,
      }
      acc.count += 1
      acc.paragraphs.add(paragraph)
      if (position === 0) acc.opens += 1
      if (sentences.length > 1 && position === sentences.length - 1) acc.closes += 1
      if (!acc.example || (!readable(acc.example) && readable(sentence.text))) acc.example = unquoted(sentence.text)
      for (const topic of topics) acc.topics.set(topic, (acc.topics.get(topic) ?? 0) + 1)
      byKey.set(key, acc)
    })
  })
  const concentrated = Math.max(1, Math.ceil(groups.length / 3))
  return [...byKey.values()]
    .map((acc) => ({
      chain: acc.chain,
      tags: acc.tags,
      type: acc.type,
      count: acc.count,
      meaning: shapeMeaning(acc.chain, acc.tags, acc.type),
      example: acc.example,
      topics: fresh && acc.paragraphs.size > concentrated
        ? []
        : [...acc.topics.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 3)
            .map(([topic]) => topic),
      paragraphs: [...acc.paragraphs].sort((a, b) => a - b),
      opens: acc.opens,
      closes: acc.closes,
    }))
    .sort((a, b) => b.count - a.count || a.chain.localeCompare(b.chain) || a.type.localeCompare(b.type))
}

/** "about 3 in 10" for a share a model can hold in mind. */
/**
 * A sentence cut out of quoted speech keeps a quote mark whose partner sits in the next
 * sentence. Drop that one unpaired mark at the edge so the example reads cleanly.
 */
export function unquoted(text: string): string {
  let out = text.trim()
  const opens = (out.match(/“/g) ?? []).length
  const closes = (out.match(/”/g) ?? []).length
  if (opens > closes && out.startsWith('“')) out = out.slice(1)
  else if (closes > opens && out.endsWith('”')) out = out.slice(0, -1)
  if ((out.match(/"/g) ?? []).length % 2 === 1) {
    if (out.startsWith('"')) out = out.slice(1)
    else if (out.endsWith('"')) out = out.slice(0, -1)
  }
  return out
}

export function shareText(part: number, whole: number): string {
  if (whole <= 0 || part <= 0) return 'none'
  const share = part / whole
  if (share >= 0.95) return 'nearly all'
  if (share >= 0.075) return `about ${Math.max(1, Math.round(share * 10))} in 10`
  if (share >= 0.04) return `about 1 in ${Math.round(1 / share)}`
  return 'a few'
}

/**
 * Where a shape tends to sit in its paragraph. It needs two or more uses there, at least 4 in 10
 * of its uses, and half again the rate any sentence has of sitting there, so a shape that is
 * simply everywhere is not tied to a place.
 */
export function shapePlace(item: Arrangement, all: Arrangement[]): string {
  const sentences = all.reduce((sum, shape) => sum + shape.count, 0)
  if (sentences === 0) return ''
  const baseOpen = all.reduce((sum, shape) => sum + (shape.opens ?? 0), 0) / sentences
  const baseClose = all.reduce((sum, shape) => sum + (shape.closes ?? 0), 0) / sentences
  const opens = item.opens ?? 0
  const closes = item.closes ?? 0
  const placed = (n: number, base: number) => n >= 2 && n / item.count >= 0.4 && n / item.count >= base * 1.5
  if (placed(opens, baseOpen)) return ' It often opens a paragraph.'
  if (placed(closes, baseClose)) return ' It often ends a paragraph.'
  return ''
}

export function shapeLine(item: Arrangement, total: number, all: Arrangement[] = [item]): string {
  const about = item.topics.length > 0 ? ` It sits in the paragraphs about ${item.topics.join(', ')}.` : ''
  const share = shareText(item.count, total)
  return `- ${item.meaning} ${share[0].toUpperCase()}${share.slice(1)} sentences.${shapePlace(item, all)} Example: "${item.example}"${about}`
}

/** The shapes the sheet shows and the score asks for: up to six, each 1 in 20 sentences or more. */
export function shownShapes(arrangements: Arrangement[] | undefined): Arrangement[] {
  const all = arrangements ?? []
  const total = all.reduce((sum, item) => sum + item.count, 0)
  const shown = all.slice(0, 6).filter((item) => item.count >= 2 && item.count / total >= 0.05)
  return shown.length > 0 ? shown : all.slice(0, 1)
}

/** The sentence-shape lines of the guide: a few shapes, what each does, and a real sentence for each. */
export function arrangementGuide(arrangements: Arrangement[] | undefined): string {
  const all = arrangements ?? []
  const total = all.reduce((sum, item) => sum + item.count, 0)
  const ranked = shownShapes(all)
  if (ranked.length === 0) return ''
  const lead = all.length > 1
    ? 'Vary the sentence shapes. These are the most common, each with a sentence from the source:'
    : 'This text uses one sentence shape. Keep it, and do not invent a second shape the text never uses:'
  return [lead, ...ranked.map((item) => shapeLine(item, total, all))].join('\n')
}
