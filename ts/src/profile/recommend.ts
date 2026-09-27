/** Turn a profile, or the gaps between two profiles, into text a bot can follow. */

import { perHundred } from '../measures/figures.ts'
import { tagLabel } from '../measures/syntax.ts'
import { shareText } from './arrangements.ts'
import { registerShare } from '../measures/register.ts'
import type { TextMiss, TextProfile } from '../types/card.ts'

function moved(miss: TextMiss, limit: number): boolean {
  return Math.abs(miss.actual - miss.target) >= limit
}

/**
 * generate: a new text in this shape, on any subject. Subject words and names are left out,
 * because they make a model copy the source's subject.
 * regenerate: a rewrite of the source. Subject words and names are kept.
 */
export type RecommendMode = 'generate' | 'regenerate'

export type RecommendOptions = {
  mode?: RecommendMode
}

function article(name: string): string {
  return /^[aeiou]/i.test(name) ? 'an' : 'a'
}

function openingsLine(starts: string[]): string {
  const counts = new Map<string, number>()
  for (const tag of starts) {
    const name = tagLabel(tag)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const openings = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, count]) => `${article(name)} ${name} in ${shareText(count, starts.length)}`)
  return `Sentences open with ${openings.join(', ')}. Keep to those openings.`
}

export function recommend(card: TextProfile, options: RecommendOptions = {}): string {
  const mode = options.mode ?? 'generate'
  const lines = [
    mode === 'regenerate'
      ? 'Write in this shape. This is a rewrite: keep the source\'s subject, its subject words, and its names. Start at the largest unit and go down.'
      : 'Write in this shape. The subject is yours; take only the shape from the source. The examples are from the source: copy how they are built, not their people, places, or things, and do not reuse any run of four or more of their words. Do not open on the first words of the first example. Start at the largest unit and go down.',
  ]
  for (const step of card.guide) {
    lines.push('')
    lines.push(`${step.level[0].toUpperCase()}${step.level.slice(1)}. ${step.text}`)
    if (step.level === 'sentence' && card.syntactic.sentenceStarts.length > 0) {
      lines.push(openingsLine(card.syntactic.sentenceStarts))
    }
    if (mode === 'regenerate' && step.subject) lines.push(step.subject)
    if (step.excerpt) lines.push(`Example: ${step.excerpt}`)
  }
  const unusual = card.lexical.functionWords.filter((word) => word.z !== undefined && Math.abs(word.z) >= 1)
  if (unusual.length > 0) {
    const note = unusual
      .map((word) => `${word.feature} is ${word.z! > 0 ? 'high' : 'low'}`)
      .join(', ')
    lines.push(`Against the background, ${note}.`)
  }
  return lines.join('\n')
}

const NOT_GLUE = /^(rhythm|tag|content|name|arrangement|joins|punct|paragraph|paragraphs|syntax|register|marked|figure)\.|^(cosine|burrowsDelta|rateGap|diversity|copied|framed|echoed)$/

/** Most repair lines the report gives. The rest stay in the misses. */
export const REPAIR_LIMIT = 8

function per100(rate: number): string {
  const n = Math.round(rate * 100)
  return n < 1 ? 'under 1 in 100 words' : `about ${n} in 100 words`
}

/** How far a glue-word rate may sit from the source, in words per 100, before it is a repair. */
export function glueBand(target: number): { low: number; high: number } {
  const center = Math.round(target * 100)
  const half = Math.max(1, Math.round(center * 0.15))
  return { low: Math.max(0, center - half), high: center + half }
}

function outsideGlueBand(miss: TextMiss): boolean {
  const { low, high } = glueBand(miss.target)
  const actual = Math.round(miss.actual * 100)
  return actual < low || actual > high
}

/** A range around a sentence length, so a repair says where to stop. */
function lengthBand(target: number): string {
  const center = Math.round(target)
  const half = Math.max(1, Math.round(center * 0.1))
  return `${Math.max(1, center - half)} to ${center + half}`
}

/** A range of shares in tenths, such as "3 to 5 in 10". */
function tenthsBand(target: number): string {
  const center = Math.round(target * 10)
  return `${Math.max(0, center - 1)} to ${Math.min(10, center + 1)} in 10`
}

const FIGURE_HABITS: Record<string, string> = {
  chain: 'lets a clause pick up the last word of the clause before',
  reread: 'follows a statement with a second reading of it',
  maxim: 'states a short general truth in the present tense',
}

export function figureMissing(miss: TextMiss): boolean {
  return miss.target > 0 && miss.actual === 0
}

export function figureOverdone(miss: TextMiss): boolean {
  return miss.actual > miss.target * 3 && miss.actual - miss.target >= 0.03
}

function byFeature(misses: TextMiss[], feature: string): TextMiss | undefined {
  return misses.find((miss) => miss.feature === feature)
}

/**
 * The difference as a repair list: a one-line lead, then the largest fixes first,
 * each with what it means and a sentence to copy, then what already matches.
 * Dropped subject words and names are a repair only for a rewrite (regenerate).
 */
export function reportMisses(misses: TextMiss[], options: RecommendOptions = {}): string {
  const mode = options.mode ?? 'generate'
  const repairs: string[] = []
  const lead: string[] = []
  const keep: string[] = []

  const q1 = byFeature(misses, 'rhythm.q1')
  const q2 = byFeature(misses, 'rhythm.q2')
  const q3 = byFeature(misses, 'rhythm.q3')
  if (q2 && q1 && q3 && !moved(q2, 1) && [q1, q3].some((miss) => moved(miss, 1))) {
    const flatter = q3.actual < q3.target || q1.actual > q1.target
    lead.push(flatter ? 'evened out the sentence lengths' : 'pushed the sentence lengths apart')
    repairs.push(
      `Sentence. A typical sentence is about right, at ${Math.round(q2.actual)} words. Short ones were about ${Math.round(q1.target)} and are ${Math.round(q1.actual)}; long ones were about ${Math.round(q3.target)} and are ${Math.round(q3.actual)}. ${flatter
        ? `Keep the typical sentence, but let about a quarter run ${Math.round(q3.target)} words or more and about a quarter stay ${Math.round(q1.target)} or fewer.`
        : `Keep the typical sentence, but bring the long ones back to about ${Math.round(q3.target)} words and the short ones up to about ${Math.round(q1.target)}.`}`,
    )
  } else if (q2 && q1 && q3 && [q1, q2, q3].some((miss) => moved(miss, 1))) {
    const shorter = q2.actual < q2.target || (q2.actual === q2.target && q3.actual < q3.target)
    lead.push(shorter ? 'cut the sentences short' : 'stretched the sentences')
    repairs.push(
      `Sentence. A typical sentence was about ${Math.round(q2.target)} words and is now about ${Math.round(q2.actual)}. Short ones were about ${Math.round(q1.target)} and are ${Math.round(q1.actual)}; long ones were about ${Math.round(q3.target)} and are ${Math.round(q3.actual)}. ${shorter ? `Bring the typical sentence back to ${lengthBand(q2.target)} words${Math.round(q3.target) > Math.round(q2.target) ? `, and let about a quarter run ${Math.round(q3.target)} or more` : ''}. Stop there; do not push past it.` : `Bring the typical sentence back down to ${lengthBand(q2.target)} words. Stop there; do not cut below it.`}`,
    )
  } else if (q2) {
    keep.push('sentence lengths')
  }
  const afterLong = byFeature(misses, 'rhythm.afterLong')
  if (afterLong && q1 && q3 && moved(afterLong, 0.15)) {
    const fewer = afterLong.actual < afterLong.target
    lead.push(fewer ? 'lost the short sentence after a long one' : 'follows too many long sentences with a short one')
    repairs.push(
      `Sentence. In the source, ${shareOf(afterLong.target)} long sentences (${Math.round(q3.target)} words or more) are followed at once by a short one (${Math.round(q1.target)} or fewer); in the reply, ${shareOf(afterLong.actual)}. ${fewer
        ? `Move short sentences from between middling ones to right after a long one, until ${tenthsBand(afterLong.target)} long sentences have one. Do not add short sentences; move them.`
        : `Let more long sentences run on into a middling one, until only ${tenthsBand(afterLong.target)} are followed by a short one.`}`,
    )
  } else if (afterLong) {
    keep.push('what follows a long sentence')
  }
  const spoken = byFeature(misses, 'rhythm.spoken')
  if (spoken && moved(spoken, Math.max(3, spoken.target * 0.25))) {
    const shorter = spoken.actual < spoken.target
    lead.push(shorter ? 'clipped the speech' : 'let the speech run long')
    repairs.push(`Speech. A typical spoken sentence in the source is about ${Math.round(spoken.target)} words; in the reply, about ${Math.round(spoken.actual)}. ${shorter ? 'Let people say more in each sentence' : 'Cut what people say into shorter sentences'}, until spoken sentences run ${lengthBand(spoken.target)} words.`)
  } else if (spoken) {
    keep.push('how long people speak')
  }

  const joined = byFeature(misses, 'joins.joined')
  const comma = byFeature(misses, 'punct.comma')
  if (joined && moved(joined, 0.15)) {
    const fewer = joined.actual < joined.target
    lead.push(fewer ? 'stopped joining clauses' : 'joins more clauses than the source')
    const commaNote = comma && moved(comma, 0.3)
      ? ` Commas went from about ${round1(comma.target)} to ${round1(comma.actual)} per sentence.`
      : ''
    repairs.push(
      fewer
        ? `Sentence. In the source, ${shareOf(joined.target)} sentences have two clauses, joined with and or hung on because or that; in the reply, ${shareOf(joined.actual)}.${commaNote} Join neighbouring short sentences with ", and", "because", or "as" until ${tenthsBand(joined.target)} sentences have two clauses, and no more.`
        : `Sentence. In the source, ${shareOf(joined.target)} sentences have two clauses, joined with and or hung on because or that; in the reply, ${shareOf(joined.actual)}.${commaNote} Split some of them into one clause each, until ${tenthsBand(joined.target)} sentences have two clauses.`,
    )
  } else if (joined) {
    keep.push('how often sentences have two clauses')
  }
  for (const miss of misses.filter((item) => item.feature.startsWith('figure.') && item.note)) {
    const habit = FIGURE_HABITS[miss.feature.slice('figure.'.length)]
    if (!habit) continue
    if (figureMissing(miss)) {
      repairs.push(`Sentence. The source ${habit}, ${perHundred(miss.target)}; the reply never does. Do it once or twice, like this: "${miss.note}"`)
    } else if (figureOverdone(miss)) {
      repairs.push(`Sentence. The reply ${habit}, ${perHundred(miss.actual)}; the source ${perHundred(miss.target)}. Do it less.`)
    } else {
      keep.push(miss.feature === 'figure.chain' ? 'the clause that picks up a word' : miss.feature === 'figure.reread' ? 'the second reading' : 'the short general truths')
    }
  }

  const paragraphs = misses
    .filter((miss) => miss.feature.startsWith('paragraph.') && miss.note)
    .sort((a, b) => Math.abs(b.actual - b.target) / b.target - Math.abs(a.actual - a.target) / a.target)
    .slice(0, 3)
  const shapes = misses.filter((miss) => miss.feature.startsWith('arrangement.') && miss.note).slice(0, 2)

  const glue = misses.filter((miss) => !NOT_GLUE.test(miss.feature))
  const dropped = glue.filter((miss) => outsideGlueBand(miss) && miss.actual < miss.target)
  const added = glue.filter((miss) => outsideGlueBand(miss) && miss.actual > miss.target)
  const aim = (miss: TextMiss) => {
    const { low, high } = glueBand(miss.target)
    return `${miss.feature} was ${per100(miss.target)} and is ${per100(miss.actual)}; aim for ${low} to ${high}`
  }
  if (dropped.length > 0) {
    lead.push('dropped glue words')
    const bits = dropped.map(aim)
    repairs.push(
      dropped.length === 1
        ? `Word. ${bits[0]}. Put it back to that rate and no higher; a reply without it sounds clipped.`
        : `Word. ${bits.join('; ')}. Put them back to those rates and no higher; a reply without them sounds clipped.`,
    )
  }
  if (added.length > 0) {
    const bits = added.map(aim)
    repairs.push(`Word. ${bits.join('; ')}. ${added.length === 1 ? 'Use it less, down to that rate and no lower.' : 'Use them less, down to those rates and no lower.'}`)
  }
  const steady = glue.filter((miss) => !outsideGlueBand(miss) && miss.target > 0).map((miss) => miss.feature)
  if (steady.length > 0) keep.push(`the rate of ${steady.slice(0, 6).join(', ')}`)

  const long = byFeature(misses, 'register.long')
  if (long && Math.abs(long.actual - long.target) >= Math.max(0.02, long.target * 0.4)) {
    lead.push(long.actual < long.target ? 'used plainer words' : 'used longer words')
    repairs.push(
      long.actual < long.target
        ? `Word. In the source, ${registerShare(long.target)} has three syllables or more; in the reply, ${registerShare(long.actual)}. Use some longer, formal words where the source would, and no more than that.`
        : `Word. In the source, ${registerShare(long.target)} has three syllables or more; in the reply, ${registerShare(long.actual)}. Use plainer, shorter words, down to the source's level.`,
    )
  } else if (long) {
    keep.push('the level of the words')
  }
  const markedDropped = misses.filter((miss) => miss.feature.startsWith('marked.') && miss.actual === 0 && miss.note)
  const markedAdded = misses.filter((miss) => miss.feature.startsWith('marked.') && miss.target === 0 && miss.note)
  if (markedDropped.length > 0) {
    repairs.push(`Word. The reply dropped words that mark the source's register: ${markedDropped.map((miss) => miss.note).join('; ')}. Use ${markedDropped.length === 1 ? 'it' : 'them'} where ${markedDropped.length === 1 ? 'it fits' : 'they fit'}.`)
  }
  if (markedAdded.length > 0) {
    repairs.push(`Word. The reply uses words the source never does: ${markedAdded.map((miss) => miss.note).join('; ')}. Drop ${markedAdded.length === 1 ? 'it' : 'them'}.`)
  }

  const echoed = byFeature(misses, 'echoed')
  if (mode === 'generate' && echoed?.note) {
    lead.push('echoed the source\'s opening')
    repairs.unshift(`Sentence. The reply opens the way the source does: "${echoed.note}" Open on your own subject, in your own words.`)
  }
  const framed = byFeature(misses, 'framed')
  if (mode === 'generate' && framed?.note) {
    lead.push('traced example sentences')
    repairs.unshift(`Sentence. These sentences trace one example word for word with new nouns: ${framed.note}. Keep the shape's opening and build, but change the length and the words around the nouns.`)
  }
  const copied = byFeature(misses, 'copied')
  if (mode === 'generate' && copied?.note) {
    lead.push('copied phrases from the examples')
    repairs.unshift(`Content. The reply copies phrases from the source's examples: ${copied.note}. Say those things your own way; take the build of a sentence, not its words.`)
  }

  const subjects = misses.filter((miss) => miss.feature.startsWith('content.') && miss.actual === 0)
  const names = misses.filter((miss) => miss.feature.startsWith('name.'))
  if (mode === 'regenerate' && (subjects.length > 0 || names.length > 0)) {
    lead.push('dropped subject words')
    const parts: string[] = []
    if (subjects.length > 0) parts.push(`The reply dropped these subject words: ${subjects.map((miss) => miss.note).join('; ')}.`)
    if (names.length > 0) parts.push(`It also dropped these names: ${names.map((miss) => miss.feature.slice('name.'.length)).join(', ')}. Keep names as written.`)
    repairs.push(`Content. ${parts.join(' ')} Keep them when the subject stays.`)
  }

  if (mode === 'regenerate') for (const miss of paragraphs) repairs.push(miss.note!)
  const size = byFeature(misses, 'paragraphs.size')
  if (mode === 'generate' && size && Number(size.note) >= 3 && Math.abs(size.actual - size.target) >= Math.max(0.5, size.target * 0.3)) {
    repairs.push(`Paragraph. A paragraph in the source holds about ${round1(size.target)} sentences; in the reply, about ${round1(size.actual)}. ${size.actual > size.target ? 'Break paragraphs more often' : 'Let paragraphs run longer'}, until they hold about ${round1(size.target)}. Keep the length you were asked for.`)
  } else if (mode === 'generate' && size) {
    keep.push('how long paragraphs run')
  }
  for (const [feature, what] of [['paragraphs.shortClose', 'how paragraphs end'], ['paragraphs.opener', 'how paragraphs open']] as const) {
    const miss = byFeature(misses, feature)
    if (miss?.note && moved(miss, 0.3)) repairs.push(miss.note)
    else if (miss) keep.push(what)
  }
  if (shapes.length > 0) lead.push('lost some sentence shapes')
  for (const miss of shapes) repairs.push(`Sentence. ${miss.note}`)

  const diversity = byFeature(misses, 'diversity')
  if (diversity && moved(diversity, 1) && Math.abs(diversity.actual - diversity.target) / Math.max(diversity.target, 1) >= 0.15) {
    repairs.push(
      diversity.actual < diversity.target
        ? 'Word. The reply repeats its words more than the source does. Do not recycle the same nouns.'
        : 'Word. The reply uses more different words than the source. Repeat a few words the source repeats instead of inventing a new one in every sentence.',
    )
  }

  const fragment = byFeature(misses, 'joins.fragment')
  if (fragment && moved(fragment, 0.1)) {
    repairs.push(
      fragment.actual > fragment.target
        ? `Sentence. The reply has sentences with no main verb in ${shareOf(fragment.actual)}; the source in ${shareOf(fragment.target)}. Give them a verb.`
        : `Sentence. The source leaves out the main verb in ${shareOf(fragment.target)} sentences; the reply almost never does.`,
    )
  }

  const count = byFeature(misses, 'paragraphs.count')
  if (mode === 'regenerate' && count && count.actual === count.target) keep.push(`${count.target} ${count.target === 1 ? 'paragraph' : 'paragraphs'}`)
  else if (mode === 'regenerate' && count) repairs.unshift(`Paragraph. The source has ${count.target} paragraphs and the reply has ${count.actual}. Match the paragraph breaks.`)
  const pronoun = byFeature(misses, 'syntax.pronoun')
  if (pronoun && !moved(pronoun, 0.03)) keep.push('the pronoun share')
  else if (pronoun) {
    repairs.push(
      pronoun.actual > pronoun.target
        ? 'Word. The reply leans on pronouns more than the source. Name people and things again when the paragraph moves on.'
        : 'Word. The reply names things again where the source uses a pronoun. Use she, he, it, or they once the person is named.',
    )
  }

  if (repairs.length === 0) {
    const kept = keep.length > 0 ? ` Keep: ${keep.join('; ')}.` : ''
    return `The measured shape matches. Keep everything as it is.${kept}`
  }
  const shown = repairs.slice(0, REPAIR_LIMIT)
  const quotes = mode === 'generate' && shown.some((line) => /(such as|like this:) "/.test(line))
    ? ' The quoted source sentences show how to build a sentence, not what to say.'
    : ''
  const lines = [
    `The reply moved${lead.length > 0 ? `: it ${lead.join(', ')}` : ''}. Put the source shape back. Fix these in order.${quotes}`,
    ...shown.map((line, index) => `${index + 1}. ${line}`),
  ]
  if (keep.length > 0) lines.push(`Keep: ${keep.join('; ')}.`)
  return lines.join('\n')
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function shareOf(rate: number): string {
  return shareText(rate, 1)
}
