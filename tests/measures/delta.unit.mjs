/**
 * Filler-word rates on a fixed list. Content words stay off that list.
 * Run: npx tsx projects/gras_to_text/tests/measures/delta.unit.mjs
 */
import assert from 'node:assert/strict'
import { functionWordRates } from '../../ts/src/measures/delta.ts'

const rates = functionWordRates(['The', 'cat', 'sat', 'upon', 'the', 'mat', '.'])
assert.equal(rates.the, 2 / 6)
assert.equal(rates.upon, 1 / 6)
assert.equal(rates.of, 0)
assert.equal(
  Object.hasOwn(rates, 'cat'),
  false,
  'negative: a content word is not a function-word rate',
)

console.log('functionWordRates: ok')
