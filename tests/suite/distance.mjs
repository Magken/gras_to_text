/**
 * How far a reply sits from a source, counted the way the repair list reads it.
 * Shared by essay-bot.unit.mjs and heldout.unit.mjs. Not a unit on its own.
 */
import { figureMissing, figureOverdone, glueBand } from '../../ts/src/profile/recommend.ts'

const RHYTHM = ['rhythm.q1', 'rhythm.q2', 'rhythm.q3']
const SUMMARY = ['cosine', 'rateGap', 'diversity', 'burrowsDelta', 'copied', 'framed', 'echoed']

function outsideGlue(miss) {
  const { low, high } = glueBand(miss.target)
  const actual = Math.round(miss.actual * 100)
  return actual < low || actual > high
}

/**
 * Misses that would become a repair. With `style`, subject words, names, and paragraph-by-paragraph
 * pairing are left out: those follow the topic and the layout, not the voice.
 */
export function movedMisses(misses, { style = false } = {}) {
  return misses.filter((miss) => {
    const gap = Math.abs(miss.actual - miss.target)
    if (RHYTHM.includes(miss.feature)) return gap >= Math.max(1, miss.target * 0.15)
    if (miss.feature === 'joins.joined' || miss.feature === 'rhythm.afterLong') return gap >= 0.15
    if (miss.feature === 'joins.fragment') return gap >= 0.1
    if (miss.feature === 'punct.comma') return gap >= 0.3
    if (miss.feature === 'rhythm.spoken') return gap >= Math.max(3, miss.target * 0.25)
    if (miss.feature.startsWith('figure.')) return figureMissing(miss) || figureOverdone(miss)
    if (miss.feature === 'syntax.pronoun') return gap >= 0.03
    if (miss.feature === 'register.long') return gap >= Math.max(0.02, miss.target * 0.4)
    if (miss.feature.startsWith('paragraphs.shortClose') || miss.feature.startsWith('paragraphs.opener')) return gap >= 0.3
    if (/^(arrangement|marked)\./.test(miss.feature)) return true
    if (/^(content|name|paragraph)\./.test(miss.feature) || miss.feature === 'paragraphs.count') return !style
    if (miss.feature === 'paragraphs.size') return Number(miss.note) >= 3 && gap >= Math.max(0.5, miss.target * 0.3)
    if (/^[a-z]+$/.test(miss.feature) && !SUMMARY.includes(miss.feature)) return outsideGlue(miss)
    return false
  })
}

export function lengthGap(misses) {
  return RHYTHM.reduce((sum, feature) => {
    const miss = misses.find((item) => item.feature === feature)
    return sum + Math.abs(miss.actual - miss.target)
  }, 0)
}
