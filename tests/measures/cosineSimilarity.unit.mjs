/**
 * Cosine of two lists. Opposite directions are -1.
 * Run: npx tsx projects/gras_to_text/tests/measures/cosineSimilarity.unit.mjs
 */
import assert from 'node:assert/strict'
import { cosineSimilarity } from '../../ts/src/measures/cosineSimilarity.ts'

assert.equal(cosineSimilarity({ the: 1 }, { the: 1 }), 1)
assert.equal(cosineSimilarity({ the: 1 }, { the: -1 }), -1)
assert.equal(cosineSimilarity({}, { the: 1 }), 0)
assert.notEqual(
  cosineSimilarity({ the: 1 }, { the: -1 }),
  1,
  'negative: opposite lists are not the same direction',
)

console.log('cosineSimilarity: ok')
