/**
 * The recommendation is text for a bot. A paste does not grow a chapter.
 * Generation leaves out subject words and names; a rewrite keeps them.
 * Run: npx tsx projects/gras_to_text/tests/profile/recommend.unit.mjs
 */
import assert from 'node:assert/strict'
import { profile, render, reportMisses } from '../../ts/src/index.ts'

const card = await profile('The lamp stood in the window.', { tag: false })
const prose = render(card)
assert.equal(prose.includes('Write in this shape.'), true)
assert.equal(prose.includes('Sentence.'), true)
assert.equal(prose.includes('Word.'), true)
assert.equal(prose.includes('Chapter.'), false, 'negative: a paste recommendation does not invent a chapter')

const parsed = JSON.parse(render(card, 'json'))
assert.equal(typeof parsed.lexical.diversity, 'number')

const s = (text, tags) => ({ text, tags })
const tagged = {
  paragraphs: [
    {
      text: 'Dr. Hale lit the kiln upon the hill. The kiln cooled slowly.',
      sentences: [
        s('Dr. Hale lit the kiln upon the hill.', ['NNP', '.', 'NNP', 'VBD', 'DT', 'NN', 'IN', 'DT', 'NN', '.']),
        s('The kiln cooled slowly.', ['DT', 'NN', 'VBD', 'RB', '.']),
      ],
    },
    {
      text: 'The kiln was left alone, and the yard went quiet. Nobody spoke of the kiln.',
      sentences: [
        s('The kiln was left alone, and the yard went quiet.', ['DT', 'NN', 'VBD', 'VBN', 'RB', ',', 'CC', 'DT', 'NN', 'VBD', 'JJ', '.']),
        s('Nobody spoke of the kiln.', ['NN', 'VBD', 'IN', 'DT', 'NN', '.']),
      ],
    },
  ],
}
const kiln = await profile(tagged, { tag: false })
const generate = render(kiln, 'prose', { mode: 'generate' })
const regenerate = render(kiln, 'prose', { mode: 'regenerate' })
assert.equal(render(kiln), generate, 'generation is the default')
assert.doesNotMatch(generate, /Keep these subject words/, 'negative: generation does not push the source subject')
assert.doesNotMatch(generate, /Keep these names/, 'negative: generation does not push names')
assert.match(regenerate, /Keep these subject words: kiln is a noun/)
assert.match(regenerate, /Keep these names as written: Dr\. Hale\./)
assert.match(generate, /upon is an older, formal word/)
assert.match(generate, /Sentences open with a determiner in about/)
assert.doesNotMatch(generate, /\d+\.\d{2,}/, 'negative: no number with more than one decimal place')
assert.doesNotMatch(generate, /quartile/, 'negative: no statistics words')

const excerpts = kiln.guide.filter((step) => step.excerpt).map((step) => step.excerpt)
const sentenceExample = kiln.guide.find((step) => step.level === 'sentence').excerpt
const wordExample = kiln.guide.find((step) => step.level === 'word').excerpt
assert.notEqual(sentenceExample, wordExample, 'the sentence step and the word step show different sentences')
assert.equal(excerpts[0].startsWith(sentenceExample), false, 'negative: the sentence example is not the opening of the first paragraph')

const lengths = (q1, q2, q3) => [
  { feature: 'rhythm.q1', target: 6, actual: q1 },
  { feature: 'rhythm.q2', target: 10, actual: q2 },
  { feature: 'rhythm.q3', target: 19, actual: q3 },
]
const ends = reportMisses(lengths(8, 10, 17))
assert.match(ends, /Sentence\. A typical sentence is about right, at 10 words\. Short ones were about 6 and are 8; long ones were about 19 and are 17\. Keep the typical sentence, but let about a quarter run 19 words or more/)
assert.doesNotMatch(ends, /cut the sentences short|Bring the typical sentence/, 'negative: a matching typical sentence is not called cut short')
assert.match(reportMisses(lengths(4, 7, 12)), /Bring the typical sentence back to 9 to 11 words/, 'negative: a short typical sentence still gets the typical repair')

const layout = [
  { feature: 'paragraphs.count', target: 68, actual: 1 },
  { feature: 'paragraphs.size', target: 1.9, actual: 5, note: '1' },
  { feature: 'paragraph.1', target: 10, actual: 20, note: 'Paragraph 1. Split the long ones.' },
]
const oneParagraph = reportMisses(layout, { mode: 'generate' })
assert.doesNotMatch(oneParagraph, /68 paragraphs|Match the paragraph breaks|Paragraph 1\.|Break paragraphs/, 'a one-paragraph reply is not asked for the source layout')
assert.match(reportMisses(layout, { mode: 'regenerate' }), /The source has 68 paragraphs and the reply has 1\. Match the paragraph breaks\./, 'negative: a rewrite keeps its own paragraph count')
const bigParagraphs = reportMisses([{ feature: 'paragraphs.size', target: 1.9, actual: 5, note: '8' }], { mode: 'generate' })
assert.match(bigParagraphs, /Paragraph\. A paragraph in the source holds about 1\.9 sentences; in the reply, about 5\. Break paragraphs more often, until they hold about 1\.9\. Keep the length you were asked for\./)
assert.doesNotMatch(reportMisses([{ feature: 'paragraphs.size', target: 1.9, actual: 2.1, note: '8' }], { mode: 'generate' }), /Break paragraphs/, 'negative: a close paragraph size is kept')

console.log('recommend: ok')
