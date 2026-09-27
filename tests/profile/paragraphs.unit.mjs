/**
 * Paragraph layout: where the long sentences gather, how paragraphs end, which shape opens them.
 * Run: npx tsx projects/gras_to_text/tests/profile/paragraphs.unit.mjs
 */
import assert from 'node:assert/strict'
import {
  closeExample,
  longPlaces,
  openerShape,
  paragraphGuide,
  shortCloseShare,
} from '../../ts/src/profile/paragraphs.ts'
import { observeArrangements, shapePlace } from '../../ts/src/profile/arrangements.ts'
import { profile, reportMisses, score } from '../../ts/src/index.ts'

const sketch = (lengths, closing = 'It stopped there.') => ({
  sentences: lengths.length,
  words: lengths.reduce((sum, n) => sum + n, 0),
  lengths,
  opening: '',
  longest: '',
  closing,
})

const gathered = [sketch([5, 6]), sketch([20, 22, 5]), sketch([25, 21])]
assert.deepEqual(longPlaces(gathered, 19), [2, 3], 'the paragraphs holding two or more long sentences')
assert.deepEqual(
  longPlaces([sketch([20, 5]), sketch([21, 5]), sketch([22, 5])], 19),
  [],
  'negative: one long sentence in every paragraph is spread, not gathered',
)

const ends = [sketch([12, 14, 4], 'The bell rang twice.'), sketch([10, 12, 15])]
assert.equal(shortCloseShare(ends, 10), 0.5)
assert.equal(closeExample(ends, 10), 'The bell rang twice.')
assert.equal(shortCloseShare([sketch([12]), sketch([4])], 10), null, 'negative: one-sentence paragraphs have no ending to measure')

const guide = paragraphGuide([...gathered, sketch([12, 14, 4], 'The bell rang twice.')], { q2: 10, q3: 19 })
assert.match(guide, /The long sentences \(19 words or more\) cluster: about 5 in 10 paragraphs hold two or more, and the rest hold one or none\./)
assert.doesNotMatch(guide, /paragraphs? \d/, 'negative: no paragraph positions, which only hold at the source length')
assert.match(guide, /paragraphs end on a short sentence/)
const mostlyLong = paragraphGuide([sketch([12, 14, 4]), sketch([10, 12, 15]), sketch([10, 12, 16]), sketch([11, 13, 14]), sketch([12, 13, 3])], { q2: 10, q3: 19 })
assert.match(mostlyLong, /the other 6 in 10 end on a longer one\. Writers following a sheet tend to end too many paragraphs on a short line; end most on a full sentence\./, 'a minority of short endings warns against the habit')
assert.doesNotMatch(paragraphGuide([sketch([12, 14, 4]), sketch([12, 14, 5])], { q2: 10, q3: 19 }), /tend to end too many/, 'negative: a text that ends most paragraphs short gets no warning')

const s = (text, tags) => ({ text, tags })
const opener = s('The kiln stood in the yard.', ['DT', 'NN', 'VBD', 'IN', 'DT', 'NN', '.'])
const middle = s('She wrote the hour down.', ['PRP', 'VBD', 'DT', 'NN', 'RP', '.'])
const shapes = observeArrangements([[opener, middle, middle], [opener, middle, middle], [middle, middle]])
const kilnShape = shapes.find((item) => item.chain === 'determiner then noun then verb')
assert.equal(kilnShape.opens, 2)
assert.equal(shapePlace(kilnShape, shapes), ' It often opens a paragraph.')
const sheShape = shapes.find((item) => item.chain === 'pronoun then verb then determiner')
assert.equal(sheShape.closes, 3)
assert.equal(shapePlace(sheShape, shapes), '', 'negative: a shape used everywhere is not tied to one place')
assert.equal(openerShape(shapes, 3), kilnShape)
assert.equal(openerShape(shapes, 1), undefined, 'negative: one paragraph has no opening pattern')

const words = ['the', 'kiln', 'kept', 'its', 'heat', 'and', 'bricks', 'ticked']
const sentence = (n) => {
  const text = Array.from({ length: n }, (_, i) => words[i % words.length]).join(' ')
  return `${text[0].toUpperCase()}${text.slice(1)}.`
}
const para = (lengths) => lengths.map(sentence).join(' ')
const offline = { tag: false }
const source = [para([20, 20, 20, 4, 4]), para([20, 6, 6])].join('\n\n')
const card = await profile(source, offline)
assert.equal(card.lexical.rhythm.q3, 20, 'the fixture puts the long length at 20')
const paragraphStep = card.guide.find((step) => step.level === 'paragraph').text
assert.match(paragraphStep, /Nearly all paragraphs end on a short sentence after longer ones/, 'the sheet says how paragraphs end')
assert.match(paragraphStep, /^Write as long as you are asked to; take rates from here, not the source's length\. A paragraph holds about 4 sentences\./)
assert.doesNotMatch(paragraphStep, /\b2 paragraphs\b/, 'negative: the sheet does not ask for the source paragraph count')

const even = [para([13, 13, 14, 14, 14]), para([20, 6, 6])].join('\n\n')
const misses = await score(even, card, offline)
const first = misses.find((miss) => miss.feature === 'paragraph.1')
assert.ok(first, 'same mean length, but the long sentences are gone: still a paragraph repair')
assert.match(first.note, /The source paragraph has 3 sentences of 20 words or more; the reply has none\. Keep the paragraph length, but let 3 of its sentences run 20 words or more/)
assert.equal(misses.some((miss) => miss.feature === 'paragraph.2'), false, 'negative: an unchanged paragraph is not a repair')
const report = reportMisses(misses)
assert.match(report, /Paragraph ends\. In the source, nearly all paragraphs end on a short sentence after longer ones; in the reply, about 5 in 10\./)

const same = reportMisses(await score(source, card, offline), { mode: 'regenerate' })
assert.doesNotMatch(same, /Paragraph ends\./, 'negative: the same text is not told to change its endings')
assert.match(same, /Keep: .*how paragraphs end/)

console.log('paragraphs: ok')
