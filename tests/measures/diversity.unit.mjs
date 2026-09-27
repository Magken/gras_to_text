/**
 * MTLD at the 0.72 cutoff. Repeats score lower than a varied list of the same length.
 * Run: npx tsx projects/gras_to_text/tests/measures/diversity.unit.mjs
 */
import assert from 'node:assert/strict'
import { lexicalDiversity } from '../../ts/src/measures/diversity.ts'

assert.equal(lexicalDiversity(['the', 'the']), 2)
assert.equal(lexicalDiversity(['cat', 'dog', 'bird', 'fish']), 4)
assert.equal(lexicalDiversity([]), 0, 'negative: an empty list is zero, not a missing number')
assert.ok(
  lexicalDiversity(['the', 'the', 'the', 'the']) < lexicalDiversity(['cat', 'dog', 'bird', 'fish']),
  'negative: repeats are not richer than four different words',
)

console.log('lexicalDiversity: ok')
