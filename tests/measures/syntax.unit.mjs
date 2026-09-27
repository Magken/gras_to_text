/**
 * Tag summaries use tags the caller already attached.
 * Run: npx tsx projects/gras_to_text/tests/measures/syntax.unit.mjs
 */
import assert from 'node:assert/strict'
import { sentencePattern, sentenceStartTags, syntaxRates, tagRates } from '../../ts/src/measures/syntax.ts'

const rates = tagRates(['NN', 'VB', 'NN'])
assert.equal(rates.NN, 2 / 3)
assert.equal(rates.VB, 1 / 3)
assert.deepEqual(tagRates([]), {}, 'negative: no tags means no invented tag')

assert.deepEqual(sentenceStartTags([['NN', 'VB'], [], ['DT']]), ['NN', 'DT'])
assert.deepEqual(
  sentenceStartTags([[]]),
  [],
  'negative: an empty sentence does not open with a tag',
)
assert.deepEqual(sentenceStartTags([['PUNCT', 'PRON', 'VERB'], ['``', 'DT']]), ['PRON', 'DT'], 'an opening quote mark is not the opening')
assert.deepEqual(sentenceStartTags([['PUNCT']]), [], 'negative: a sentence of punctuation has no opening')

assert.equal(sentencePattern(['DT', 'NN', 'VBD', '.']), 'determiner then noun then verb')
assert.equal(sentencePattern(['.']), '', 'negative: punctuation is not a sentence pattern')

const passive = syntaxRates(['PRP', 'VBD', 'VBN'], ['they', 'were', 'seen'])
assert.equal(passive.pronoun, 1 / 3)
assert.equal(passive.passive, 1 / 3)
const universal = syntaxRates(['PRON', 'AUX', 'VERB'], ['they', 'were', 'seen'])
assert.equal(universal.passive, 1 / 3)
const plain = syntaxRates(['DT', 'NN'], ['the', 'cat'])
assert.equal(plain.pronoun, 0)
assert.equal(plain.passive, 0, 'negative: a noun after a determiner is not passive')
assert.deepEqual(syntaxRates([]), { pronoun: 0, passive: 0 })

console.log('tagRates: ok')
