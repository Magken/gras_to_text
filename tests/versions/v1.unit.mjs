/**
 * Version 1 fills the lexical section and leaves a level out when the text has none.
 * Version 2 is a different loop and is not this file.
 * Run: npx tsx projects/gras_to_text/tests/versions/v1.unit.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { profile } from '../../ts/src/index.ts'

const offline = { tag: false }
const sample = readFileSync(new URL('../../spec/fixtures/sample.txt', import.meta.url), 'utf8')
const card = await profile(sample, offline)
assert.ok(card.lexical.functionWords.some((word) => word.feature === 'the' && word.rate > 0))
assert.equal(card.lexical.functionWords.find((word) => word.feature === 'the').z, undefined)
assert.equal(typeof card.lexical.diversity, 'number')
assert.ok(card.lexical.rhythm.q2 > 0)
assert.deepEqual(
  card.guide.map((step) => step.level),
  ['paragraph', 'sentence', 'word'],
  'negative: the sample has no chapter',
)
assert.deepEqual(card.semantic, {})
assert.deepEqual(card.syntactic.tagRates, {})

const scored = await profile('The cat sat upon the mat.', {
  ...offline,
  background: { the: { mean: 0, spread: 1 }, upon: { mean: 0, spread: 1 } },
})
assert.equal(scored.lexical.functionWords.find((word) => word.feature === 'the').rate, 2 / 6)
assert.equal(scored.lexical.functionWords.find((word) => word.feature === 'upon').rate, 1 / 6)
assert.equal(scored.lexical.functionWords.find((word) => word.feature === 'the').z, 2 / 6)

const tagged = await profile({
  paragraphs: [
    {
      text: 'The cat sat.',
      sentences: [{ text: 'The cat sat.', tags: ['DT', 'NN', 'VBD'] }],
    },
  ],
})
assert.equal(tagged.syntactic.tagRates.DT, 1 / 3)
assert.deepEqual(tagged.syntactic.sentenceStarts, ['DT'])
const sentence = tagged.guide.find((step) => step.level === 'sentence')
assert.equal(sentence.text.includes('Open by naming the thing, then say what it did.'), true)
assert.equal(tagged.syntactic.arrangements[0].chain, 'determiner then noun then verb', 'the tag chain stays in the profile')
assert.equal(tagged.content.words.find((word) => word.word === 'cat').uses[0].tag, 'NN')
assert.equal(tagged.guide.find((step) => step.level === 'word').subject.includes('cat is a noun'), true)
assert.equal(tagged.guide.find((step) => step.level === 'word').text.includes('of'), false, 'negative: a filler word at rate 0 is left off the guide')

const book = await profile('# One\n\n## A\n\nHello there. The bus left.', offline)
assert.equal(book.guide[0].level, 'chapter')
assert.equal(book.guide[1].level, 'section')

const blank = await profile('', offline)
assert.deepEqual(blank.guide, [], 'negative: an empty text does not grow a sentence')

await assert.rejects(
  () => profile('Hello.', { version: 2 }),
  /profile version 2 is not implemented/,
  'negative: version 2 is not version 1',
)

console.log('profile v1: ok')
