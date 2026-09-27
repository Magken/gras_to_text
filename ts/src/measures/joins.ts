/**
 * How a sentence is put together: one clause, two clauses joined with and or but,
 * a clause hung on because or that, or no main verb at all.
 * Also the punctuation each sentence carries. Punctuation needs no tags.
 */

import type { AnnotatedSentence } from '../input/readInput.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import type { JoinRates, Punctuation, SentenceType } from '../types/card.ts'

export type SentenceBuild = {
  type: SentenceType
  /** Two clauses joined with and, but, or, yet, so, or nor. */
  joined: boolean
  /** A clause hung on because, as, if, that, who, which, and the like. */
  hung: boolean
}

const VERB_TAG = /^(VB|VERB$|AUX$|MD$)/
const NOUN_TAG = /^(NN|NOUN$|PROPN$)/
const SUBJECT_TAG = /^(NN|NOUN$|PROPN$|PRP$|PRON$|DT$|DET$)/
const COORD = new Set(['and', 'but', 'or', 'yet', 'so', 'nor'])
const PENN_SUBORD = new Set(['because', 'although', 'though', 'while', 'whilst', 'if', 'unless', 'since', 'until', 'whether', 'that'])
const RELATIVE = new Set(['that', 'which', 'who', 'whom', 'whose'])

/** Words lined up with tags. Supplied tags may skip punctuation, so try both token lists. */
export function alignedWords(sentence: AnnotatedSentence): string[] {
  const tags = sentence.tags ?? []
  if (sentence.words && sentence.words.length === tags.length) return sentence.words
  const tokens = tokenizeWords(sentence.text)
  if (tokens.length === tags.length) return tokens
  return tokens.filter((token) => /^[A-Za-z0-9]/.test(token))
}

function isVerb(tag: string | undefined): boolean {
  return tag !== undefined && VERB_TAG.test(tag)
}

export function sentenceBuild(sentence: AnnotatedSentence): SentenceBuild | null {
  const tags = sentence.tags ?? []
  if (tags.length === 0) return null
  const words = alignedWords(sentence).map((word) => word.toLowerCase())
  if (!tags.some(isVerb)) return { type: 'fragment', joined: false, hung: false }
  let joined = false
  let hung = false
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    const word = words[i] ?? ''
    if (tag === 'SCONJ' || tag === 'WDT' || tag === 'WP' || tag === 'WP$') hung = true
    if (tag === 'IN' && PENN_SUBORD.has(word)) hung = true
    if ((tag === 'PRON' || tag === 'DET') && RELATIVE.has(word) && i > 0 && NOUN_TAG.test(tags[i - 1])) hung = true
    if ((tag === 'CCONJ' || tag === 'CC') && COORD.has(word) && i > 0) {
      const before = tags.slice(0, i).some(isVerb)
      const next = tags.findIndex((item, index) => index > i && isVerb(item))
      if (!before || next === -1) continue
      const comma = words[i - 1] === ','
      const subject = tags.slice(i + 1, next).some((item) => SUBJECT_TAG.test(item))
      if (comma || subject) joined = true
    }
  }
  const type: SentenceType = hung ? 'complex' : joined ? 'compound' : 'simple'
  return { type, joined, hung }
}

/** Share of tagged sentences of each type. Null when nothing is tagged. */
export function joinRates(sentences: AnnotatedSentence[]): JoinRates | null {
  const builds = sentences.map(sentenceBuild).filter((build): build is SentenceBuild => build !== null)
  if (builds.length === 0) return null
  const share = (type: SentenceType) => builds.filter((build) => build.type === type).length / builds.length
  return { simple: share('simple'), compound: share('compound'), complex: share('complex'), fragment: share('fragment') }
}

/** Marks per sentence. A quote is the share of sentences that carry a double quote. */
export function punctuationRates(texts: string[]): Punctuation {
  const count = Math.max(texts.length, 1)
  const per = (pattern: RegExp) => texts.reduce((sum, text) => sum + (text.match(pattern)?.length ?? 0), 0) / count
  const commas = texts.reduce((sum, text) => sum + (text.match(/,/g)?.length ?? 0), 0)
  const joins = texts.reduce((sum, text) => sum + (text.match(JOIN_COMMA)?.length ?? 0), 0)
  return {
    comma: per(/,/g),
    semicolon: per(/;/g),
    colon: per(/:/g),
    dash: per(/—|–|--|\s-\s/g),
    quote: texts.filter((text) => /["“”]/.test(text)).length / count,
    withComma: texts.filter((text) => text.includes(',')).length / count,
    beforeJoin: commas === 0 ? 0 : joins / commas,
  }
}

/** A comma that opens a second clause: before and, but, or a word that hangs a clause. */
const JOIN_COMMA = /,[”"’]?\s+(and|but|or|so|yet|nor|because|as|since|though|although|while|if|when|where|which|who|whom|that)\b/gi

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function capital(text: string): string {
  return `${text[0].toUpperCase()}${text.slice(1)}`
}

function share(n: number): string {
  if (n >= 0.95) return 'nearly all'
  if (n >= 0.075) return `about ${Math.max(1, Math.round(n * 10))} in 10`
  if (n >= 0.04) return `about 1 in ${Math.round(1 / n)}`
  if (n > 0) return 'a few'
  return 'none'
}

/** What the build mix and the punctuation mean for a reply. */
export function joinsGuide(joins: JoinRates | undefined, punctuation: Punctuation | undefined): string {
  const parts: string[] = []
  if (joins) {
    const joined = joins.compound + joins.complex
    const mix = [`How sentences are built: ${share(joins.simple)} are one clause.`]
    if (joined > 0) {
      const how: string[] = []
      if (joins.compound > 0) how.push(`${share(joins.compound)} joined with and, but, or so`)
      if (joins.complex > 0) how.push(`${share(joins.complex)} with a clause hung on because, as, if, that, or who`)
      mix.push(`${capital(share(joined))} have two clauses: ${how.join(', and ')}.`)
    }
    if (joins.fragment > 0) mix.push(`${capital(share(joins.fragment))} have no main verb.`)
    parts.push(`${mix.join(' ')} Keep that mix.`)
    if (joined >= 0.3) parts.push('Do not cut a joined sentence into separate short ones.')
    else if (joined < 0.04) parts.push('Keep sentences to one clause. Do not join them.')
  }
  if (punctuation) {
    const where = punctuation.withComma === undefined || punctuation.comma === 0
      ? ''
      : `, in ${share(punctuation.withComma)} sentences; ${(punctuation.beforeJoin ?? 0) >= 0.5 ? 'most come before and, but, or a clause hung on because or who' : 'most set off a phrase, a name, or a list'}`
    parts.push(`Commas: about ${round1(punctuation.comma)} per sentence${where}.`)
    const rare: string[] = []
    const absent: string[] = []
    for (const [name, rate] of [['semicolons', punctuation.semicolon], ['colons', punctuation.colon], ['dashes', punctuation.dash]] as const) {
      if (rate > 0) rare.push(`${name} in ${share(Math.min(rate, 1))} sentences`)
      else absent.push(name)
    }
    if (rare.length > 0) parts.push(`There are ${rare.join(', ')}.`)
    if (absent.length > 0) parts.push(`There are no ${absent.join(' or ')}. Do not add them.`)
    if (punctuation.quote > 0) parts.push(`Quoted speech appears in ${share(punctuation.quote)} sentences.`)
  }
  return parts.join(' ')
}