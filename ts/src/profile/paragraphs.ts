/**
 * Paragraph layout a model can follow, as rates that hold at any length: how the long sentences cluster,
 * how paragraphs end, and which sentence shape opens them.
 * Reads the paragraph sketches, so the length and ending lines need no tags.
 */

import { shareText } from './arrangements.ts'
import type { Arrangement, ParagraphSketch } from '../types/card.ts'

/** Sentences in this paragraph at or above the long length. */
export function longCount(sketch: ParagraphSketch, long: number): number {
  return sketch.lengths.filter((length) => length >= long).length
}

/**
 * Paragraphs, counted from 1, that hold two or more long sentences, most first.
 * Empty when there are too few long sentences, or when they are spread across the text.
 */
export function longPlaces(sketches: ParagraphSketch[], long: number): number[] {
  const counts = sketches.map((sketch, index) => ({ paragraph: index + 1, count: longCount(sketch, long) }))
  const total = counts.reduce((sum, item) => sum + item.count, 0)
  if (total < 3) return []
  const heavy = counts.filter((item) => item.count >= 2).sort((a, b) => b.count - a.count || a.paragraph - b.paragraph)
  const held = heavy.reduce((sum, item) => sum + item.count, 0)
  if (held < total / 2) return []
  return heavy.slice(0, 4).map((item) => item.paragraph).sort((a, b) => a - b)
}

/** A paragraph of two or more sentences whose last sentence is short and shorter than the rest. */
export function isShortClose(sketch: ParagraphSketch, typical: number): boolean {
  if (sketch.lengths.length < 2) return false
  const last = sketch.lengths[sketch.lengths.length - 1]
  const rest = sketch.lengths.slice(0, -1)
  const mean = rest.reduce((sum, n) => sum + n, 0) / rest.length
  return last <= typical && last < mean
}

/** Share of paragraphs of two or more sentences that end short. Null when fewer than two such paragraphs. */
export function shortCloseShare(sketches: ParagraphSketch[], typical: number): number | null {
  const counted = sketches.filter((sketch) => sketch.lengths.length >= 2)
  if (counted.length < 2) return null
  return counted.filter((sketch) => isShortClose(sketch, typical)).length / counted.length
}

/** A short closing sentence from the source, at least four words long. */
export function closeExample(sketches: ParagraphSketch[], typical: number): string | undefined {
  return sketches.find((sketch) => isShortClose(sketch, typical) && sketch.lengths[sketch.lengths.length - 1] >= 4)?.closing
}

/** The shape that opens the most paragraphs, when it opens at least two and about 3 in 10 or more. */
export function openerShape(arrangements: Arrangement[] | undefined, paragraphs: number): Arrangement | undefined {
  if (paragraphs < 2) return undefined
  const ranked = [...(arrangements ?? [])].sort((a, b) => (b.opens ?? 0) - (a.opens ?? 0))
  const top = ranked[0]
  if (!top || (top.opens ?? 0) < 2 || (top.opens ?? 0) / paragraphs < 0.25) return undefined
  return top
}

function capital(text: string): string {
  return `${text[0].toUpperCase()}${text.slice(1)}`
}

/** The paragraph lines of the guide: long sentences, endings, openings. */
export function paragraphGuide(
  sketches: ParagraphSketch[],
  rhythm: { q2: number; q3: number },
  arrangements?: Arrangement[],
): string {
  const parts: string[] = []
  const long = Math.round(rhythm.q3)
  if (longPlaces(sketches, rhythm.q3).length > 0) {
    const heavy = sketches.filter((sketch) => longCount(sketch, rhythm.q3) >= 2).length
    parts.push(`The long sentences (${long} words or more) cluster: ${shareText(heavy, sketches.length)} paragraphs hold two or more, and the rest hold one or none.`)
  }
  const share = shortCloseShare(sketches, rhythm.q2)
  if (share !== null) {
    const counted = sketches.filter((sketch) => sketch.lengths.length >= 2).length
    const example = closeExample(sketches, rhythm.q2)
    const such = example ? ` Such as: "${example}"` : ''
    if (share >= 0.5) {
      parts.push(`${capital(shareText(share * counted, counted))} paragraphs end on a short sentence after longer ones. End most paragraphs that way.${such}`)
    } else if (share <= 0.2) {
      parts.push('Paragraphs rarely end on a short sentence; let the last sentence run as long as the rest.')
    } else {
      parts.push(`${capital(shareText(share * counted, counted))} paragraphs end on a short sentence; the other ${shareText((1 - share) * counted, counted).replace(/^about /, '')} end on a longer one. Writers following a sheet tend to end too many paragraphs on a short line; end most on a full sentence.${such}`)
    }
  }
  const opener = openerShape(arrangements, sketches.length)
  if (opener) {
    parts.push(`${capital(shareText(opener.opens ?? 0, sketches.length))} paragraphs open this way: ${opener.meaning} Example: "${opener.example}"`)
  }
  return parts.join(' ')
}
