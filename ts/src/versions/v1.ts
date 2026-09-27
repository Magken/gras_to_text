/**
 * Version 1. Reads the input, counts words upward, and writes the guide downward.
 * Later versions are new files beside this one. This file stays.
 */

import { paragraphShape, sectionShape, type ParagraphShape } from '../hierarchy/hierarchy.ts'
import { readInput, type AnnotatedSentence, type InputFile, type PreparedText } from '../input/readInput.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import { splitSentences } from '../input/splitSentences.ts'
import type { RateBackground } from '../measures/contrast.ts'
import { zScores } from '../measures/contrast.ts'
import { functionWordRates, PROSE_RATES } from '../measures/delta.ts'
import { lexicalDiversity } from '../measures/diversity.ts'
import { figureRates, perHundred } from '../measures/figures.ts'
import { joinRates, joinsGuide, punctuationRates, sentenceBuild } from '../measures/joins.ts'
import { sentenceRhythm } from '../measures/rhythm.ts'
import { sentencePattern, sentenceStartTags, syntaxRates, tagRates } from '../measures/syntax.ts'
import { arrangementGuide, observeArrangements, shareText, unquoted } from '../profile/arrangements.ts'
import { keptSubjects, observeDictionary, paragraphGroups, splitDictionary, subjectGuide } from '../profile/dictionary.ts'
import { registerGuide, registerOf } from '../measures/register.ts'
import { paragraphGuide } from '../profile/paragraphs.ts'
import { selectFeatures } from '../profile/select.ts'
import type { EmptySection, Figures, GuideStep, ParagraphSketch, StoredDictionary, TextProfile } from '../types/card.ts'

export type ProfileOptions = {
  version?: number
  background?: RateBackground
  /** When false, a paste with no tags stays untagged. The tagger runs otherwise. */
  tag?: boolean
  /** A stored dictionary of words and sentence shapes. This text is added onto it. */
  dictionary?: StoredDictionary
}

const empty = {} as EmptySection

function wordCount(sentence: string): number {
  return tokenizeWords(sentence).filter((token) => /^[A-Za-z0-9]/.test(token)).length
}

function paragraphTexts(prepared: PreparedText): string[] {
  if (prepared.chapters.length > 0) {
    const texts: string[] = []
    for (const chapter of prepared.chapters) {
      for (const section of chapter.sections) texts.push(...section.paragraphs)
    }
    return texts
  }
  return prepared.paragraphs
}

function sentencesOf(prepared: PreparedText): AnnotatedSentence[] {
  if (prepared.sentences) return prepared.sentences
  return paragraphTexts(prepared).flatMap((paragraph) =>
    splitSentences(paragraph).map((text) => ({ text })),
  )
}

function hasTags(sentences: AnnotatedSentence[]): boolean {
  return sentences.some((sentence) => sentence.tags && sentence.tags.length > 0)
}

async function withTags(sentences: AnnotatedSentence[], options: ProfileOptions): Promise<AnnotatedSentence[]> {
  if (hasTags(sentences) || options.tag === false) return sentences
  const { annotate } = await import('../profile/annotate.ts')
  const tagged: AnnotatedSentence[] = []
  for (const sentence of sentences) {
    const found = await annotate(sentence.text)
    tagged.push({
      text: sentence.text,
      tags: found.flatMap((item) => item.tags ?? []),
      words: found.flatMap((item) => item.words ?? []),
    })
  }
  return tagged
}

function contentWords(sentence: AnnotatedSentence): string[] {
  return tokenizeWords(sentence.text).filter((token) => /^[A-Za-z]/.test(token))
}

function paragraphShapes(prepared: PreparedText): ParagraphShape[] {
  const shapes: ParagraphShape[] = []
  for (const paragraph of paragraphTexts(prepared)) {
    const shape = paragraphShape(
      splitSentences(paragraph).map((text) => ({ wordCount: wordCount(text), startTag: null })),
    )
    if (shape) shapes.push(shape)
  }
  return shapes
}

function shown(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function guideFor(
  prepared: PreparedText,
  profile: TextProfile,
  shapes: ParagraphShape[],
  sentences: AnnotatedSentence[],
): GuideStep[] {
  const steps: GuideStep[] = []
  const firstSentence = sentences[0]?.text
  for (const chapter of prepared.chapters) {
    if (!chapter.title) continue
    steps.push({
      level: 'chapter',
      text: `Chapter "${chapter.title}" has ${chapter.sections.length} ${chapter.sections.length === 1 ? 'section' : 'sections'}.`,
      excerpt: chapter.sections[0]?.paragraphs[0],
    })
    for (const section of chapter.sections) {
      if (!section.title) continue
      steps.push({
        level: 'section',
        text: `Section "${section.title}" has ${section.paragraphs.length} ${section.paragraphs.length === 1 ? 'paragraph' : 'paragraphs'}.`,
        excerpt: section.paragraphs[0],
      })
    }
  }
  const rolled = sectionShape(shapes)
  if (rolled) {
    const layout = paragraphGuide(profile.structural.paragraphs ?? [], profile.lexical.rhythm, profile.syntactic.arrangements)
    steps.push({
      level: 'paragraph',
      text: `Write as long as you are asked to; take rates from here, not the source's length. A paragraph holds about ${shown(rolled.meanSentences)} ${rolled.meanSentences === 1 ? 'sentence' : 'sentences'}.${layout ? ` ${layout}` : ''}`,
      excerpt: paragraphTexts(prepared)[0],
    })
  }
  if (sentences.length === 0) return steps
  const tags = sentences.flatMap((sentence) => sentence.tags ?? [])
  const kept = selectFeatures(
    Object.fromEntries(profile.lexical.functionWords.map((word) => [word.feature, word.rate])),
  )
  const markedWords = (profile.lexical.register?.marked ?? []).map((item) => item.word)
  const examples = pickExamples(paragraphTexts(prepared)[0] ?? '', sentences, profile.lexical.rhythm.q2, kept, markedWords)
  const length = lengthLine(profile.lexical.rhythm, sentences.map((sentence) => wordCount(sentence.text)))
  const shapeText = arrangementGuide(profile.syntactic.arrangements)
  const pattern = sentencePattern(sentences[0]?.tags ?? [])
  const rates = tags.length > 0 ? syntaxRates(tags, sentences.flatMap(contentWords)) : null
  const sentenceText = [
    length,
    joinsGuide(profile.syntactic.joins, profile.syntactic.punctuation),
    rates ? pronounLine(rates) : '',
    profile.syntactic.figures ? figuresLine(profile.syntactic.figures) : '',
  ]
    .filter((part) => part.length > 0)
    .join(' ')
    .concat(shapeText ? `\n${shapeText}` : pattern ? ` A typical sentence runs ${pattern}.` : '')
  steps.push({
    level: 'sentence',
    text: sentenceText,
    excerpt: examples.sentence ?? firstSentence,
  })
  const wordText = [
    glueLine(profile.lexical.functionWords),
    kept.length > 0 ? 'These glue words carry the voice. Keep them at about those rates; a reply that drops them sounds clipped.' : '',
    registerGuide(profile.lexical.register),
  ]
    .filter((part) => part.length > 0)
    .join(' ')
  const subject = subjectGuide(profile.content)
  steps.push({
    level: 'word',
    text: wordText,
    ...(subject ? { subject } : {}),
    excerpt: examples.word ?? firstSentence,
  })
  return steps
}

function sketchOf(group: AnnotatedSentence[]): ParagraphSketch {
  const lengths = group.map((sentence) => wordCount(sentence.text))
  const builds = group.map(sentenceBuild)
  const tagged = builds.some((build) => build !== null)
  const longest = group[lengths.indexOf(Math.max(...lengths))]?.text ?? ''
  return {
    sentences: group.length,
    words: lengths.reduce((sum, n) => sum + n, 0),
    lengths,
    ...(tagged ? { joined: builds.filter((build) => build && build.type !== 'simple' && build.type !== 'fragment').length } : {}),
    opening: group.slice(0, 2).map((sentence) => sentence.text).join(' '),
    longest,
    closing: unquoted(group[group.length - 1]?.text ?? ''),
  }
}

/** Pronoun and passive rates as instructions. The percentages stay so a caller can check them. */
export function pronounLine(rates: { pronoun: number; passive: number }): string {
  if (rates.pronoun === 0) return `There are no pronouns (0.0%). Name people and things every time. ${passiveLine(rates.passive)}`
  const share = `About 1 word in ${Math.round(1 / rates.pronoun)} is a pronoun (${(rates.pronoun * 100).toFixed(1)}%)`
  const usual = `about 1 in ${Math.round(1 / NARRATIVE_PRONOUN)}`
  const pronoun = rates.pronoun < NARRATIVE_PRONOUN * 0.85
    ? `${share}, fewer than most stories use (${usual}). About 1 in ${Math.round(1 / (1 - rates.pronoun / NARRATIVE_PRONOUN))} times you would write he, she, or it, name the person or thing instead; keep the rest as pronouns.`
    : rates.pronoun > NARRATIVE_PRONOUN * 1.15
      ? `${share}, more than most stories use (${usual}). Let people speak as I and you, and refer back with he, she, and it rather than repeating names.`
      : `${share}. Use a pronoun when the person was just named, and name them again when the paragraph moves on.`
  return `${pronoun} ${passiveLine(rates.passive)}`
}

/** Pronoun share of ordinary narrative English, the habit a writer falls back on. */
const NARRATIVE_PRONOUN = 0.11

function passiveLine(passive: number): string {
  return passive < 0.02
    ? `The passive is rare (${(passive * 100).toFixed(1)}%). Say who does the act.`
    : `Some sentences are passive (${(passive * 100).toFixed(1)}%), such as "they were seen". Keep a few.`
}

/**
 * The filler words with their rates, most used first. A bare list reads as "use all of these",
 * so a word the source barely uses is named as rare.
 */
export function glueLine(words: TextProfile['lexical']['functionWords']): string {
  const kept = words.filter((word) => word.rate > 0).sort((a, b) => b.rate - a.rate)
  if (kept.length === 0) return 'The starter filler list does not appear.'
  const common = kept.filter((word) => Math.round(word.rate * 100) >= 1)
  const rare = kept.filter((word) => Math.round(word.rate * 100) < 1)
  const parts: string[] = []
  if (common.length > 0) {
    const rates = common.map((word, index) => `${word.feature} about ${Math.round(word.rate * 100)}${index === 0 ? ' in 100 words' : ''}`)
    parts.push(`Glue words, as the source uses them: ${rates.join(', ')}.`)
  }
  if (rare.length > 0) {
    const names = rare.map((word) => word.feature)
    const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    parts.push(`${list} ${names.length === 1 ? 'is' : 'are'} rare, under 1 in 100 words; use ${names.length === 1 ? 'it' : 'them'} only now and then.`)
  }
  const groups: Record<string, string[]> = { 'over twice the': [], more: [], less: [], 'under half the': [], 'about as much': [] }
  for (const word of common) {
    const usual = PROSE_RATES[word.feature as keyof typeof PROSE_RATES]
    if (!usual) continue
    const ratio = word.rate / usual
    const group = ratio >= 2 ? 'over twice the' : ratio >= 1.5 ? 'more' : ratio <= 0.5 ? 'under half the' : ratio < 0.7 ? 'less' : word.rate >= 0.02 ? 'about as much' : ''
    if (group) groups[group].push(`"${word.feature}" (${Math.max(1, Math.round(usual * 100))})`)
  }
  const against = Object.entries(groups).filter(([, words]) => words.length > 0).map(([group, words]) => `${group} ${words.join(', ')}`)
  if (against.length > 1 || (against.length === 1 && groups['about as much'].length === 0)) {
    parts.push(`Against ordinary English prose, whose rate per 100 words is in brackets, the source uses ${against.join('; ')}. Hold to the source's rates, not the ordinary ones.`)
  }
  return parts.join(' ')
}

/** Sentence lengths as a mix a model can aim for, plus what tends to follow a long sentence. */
const FIGURE_LINES: Record<'chain' | 'reread' | 'maxim', string> = {
  chain: 'a clause picks up the last word of the clause before',
  reread: 'a statement is followed by a second reading of it',
  maxim: 'the narrator states a short general truth in the present tense',
}

export function figuresLine(figures: Figures): string {
  return (['chain', 'reread', 'maxim'] as const)
    .filter((habit) => figures[habit] > 0 && figures.examples[habit])
    .map((habit) => `Now and then ${FIGURE_LINES[habit]}, ${perHundred(figures[habit])}: "${figures.examples[habit]}"`)
    .join(' ')
}

export function lengthLine(rhythm: TextProfile['lexical']['rhythm'], lengths: number[]): string {
  const q1 = Math.round(rhythm.q1)
  const q2 = Math.round(rhythm.q2)
  const q3 = Math.round(rhythm.q3)
  if (q1 === q3) return `Every sentence is about ${q2} words. Keep them that length.`
  const parts = [
    `Mix the lengths: about a quarter of sentences are ${q1} words or fewer, half fall between ${q1} and ${q3}, and a quarter run ${q3} or more. A typical sentence is about ${q2} words.`,
  ]
  const sorted = [...lengths].sort((a, b) => a - b)
  const longest = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))]
  if (longest !== undefined && longest > q3) {
    parts.push(`In every 8 sentences, about 2 run ${q3} words or more, and the longest reach about ${longest}. Writers following a sheet tend to cut these short; let them run their full length.`)
  }
  const longs = lengths.slice(0, -1).filter((length) => length >= rhythm.q3).length
  if (longs >= 3 && rhythm.afterLong > 0) {
    const share = shareText(rhythm.afterLong, 1)
    parts.push(`${share[0].toUpperCase()}${share.slice(1)} long sentences are followed at once by a short one, of ${q1} words or fewer; that is where much of the contrast sits.`)
  } else if (longs >= 3) {
    parts.push('A long sentence is never followed at once by a short one.')
  }
  if (rhythm.spoken !== undefined) {
    const spoken = Math.round(rhythm.spoken)
    parts.push(rhythm.spoken >= rhythm.q2 * 0.85
      ? `Speech runs as long as the narration: a typical spoken sentence is about ${spoken} words. Let people talk in full sentences, not short lines.`
      : `Speech is shorter than the narration: a typical spoken sentence is about ${spoken} words.`)
  }
  return parts.join(' ')
}

/** A different source sentence for the sentence step and the word step, both outside the first paragraph. */
function pickExamples(
  firstParagraph: string,
  sentences: AnnotatedSentence[],
  typical: number,
  glue: string[],
  marked: string[],
): { sentence?: string; word?: string } {
  const pool = sentences.filter((sentence) => !firstParagraph.includes(sentence.text))
  if (pool.length === 0) return {}
  const byLength = [...pool].sort(
    (a, b) => Math.abs(wordCount(a.text) - typical) - Math.abs(wordCount(b.text) - typical),
  )
  const sentence = byLength[0].text
  let word: string | undefined
  let best = -1
  for (const item of pool) {
    if (item.text === sentence) continue
    const tokens = new Set(tokenizeWords(item.text).map((token) => token.toLowerCase()))
    const score = glue.filter((feature) => tokens.has(feature)).length + (marked.some((word) => tokens.has(word)) ? 3 : 0)
    if (score > best) {
      best = score
      word = item.text
    }
  }
  return { sentence, word }
}

export async function profileV1(input: string | InputFile, options: ProfileOptions = {}): Promise<TextProfile> {
  const prepared = await readInput(input)
  const groups = paragraphGroups(prepared)
  const flat = groups.flat()
  const sentences = await withTags(flat.length > 0 ? flat : sentencesOf(prepared), options)
  let cursor = 0
  const taggedGroups = groups.map((group) => group.map(() => sentences[cursor++]))
  const arrangements = observeArrangements(taggedGroups)
  const joins = joinRates(sentences)
  const sketches = taggedGroups.filter((group) => group.length > 0).map(sketchOf)
  const sentenceTexts = sentences.map((sentence) => sentence.text)
  const words = sentenceTexts.flatMap((sentence) => tokenizeWords(sentence))
  const rates = functionWordRates(words)
  const scores = options.background ? zScores(rates, options.background) : {}
  const tags = sentences.flatMap((sentence) => sentence.tags ?? [])
  const tagged = sentences.filter((sentence) => sentence.tags && sentence.tags.length > 0)
  const usage = splitDictionary(observeDictionary(sentences, options.dictionary ?? {}))
  const subjectSet = new Set([
    ...keptSubjects(usage.content).map((entry) => entry.word),
    ...(usage.content.names ?? []).flatMap((entry) => entry.name.toLowerCase().split(/[\s.]+/)),
  ])
  const figures = figureRates(sentenceTexts)
  const register = words.some((token) => /^[A-Za-z]/.test(token)) ? registerOf(words, subjectSet) : undefined
  const profile: TextProfile = {
    lexical: {
      functionWords: Object.entries(rates).map(([feature, rate]) => ({
        feature,
        rate,
        ...(feature in scores ? { z: scores[feature] } : {}),
      })),
      diversity: Math.round(lexicalDiversity(words.filter((token) => /^[A-Za-z0-9]/.test(token))) * 1000) / 1000,
      rhythm: sentenceRhythm(sentenceTexts),
      ...(register ? { register } : {}),
    },
    syntactic: {
      tagRates: tags.length > 0 ? tagRates(tags) : {},
      sentenceStarts: sentenceStartTags(tagged.map((sentence) => sentence.tags ?? [])),
      ...(arrangements.length > 0
        ? { arrangements: arrangements.slice(0, 24) }
        : options.dictionary?.arrangements?.length
          ? { arrangements: options.dictionary.arrangements.slice(0, 24) }
          : {}),
      ...(joins ? { joins } : {}),
      punctuation: punctuationRates(sentenceTexts),
      ...(figures.chain + figures.reread + figures.maxim > 0 ? { figures } : {}),
    },
    semantic: empty,
    functional: usage.functional,
    structural: sketches.length > 0 ? { paragraphs: sketches } : {},
    content: usage.content,
    language: empty,
    guide: [],
  }
  profile.guide = guideFor(prepared, profile, paragraphShapes(prepared), sentences)
  return profile
}
