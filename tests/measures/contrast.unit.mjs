/**
 * Z-scores use the background the caller passed. Unknown features stay out.
 * Run: npx tsx projects/gras_to_text/tests/measures/contrast.unit.mjs
 */
import assert from 'node:assert/strict'
import { zScores } from '../../ts/src/measures/contrast.ts'

const scores = zScores(
  { the: 6, of: 2 },
  { the: { mean: 4, spread: 2 }, of: { mean: 4, spread: 2 } },
)
assert.equal(scores.the, 1)
assert.equal(scores.of, -1)
assert.equal(
  Object.hasOwn(zScores({ war: 0.1 }, { the: { mean: 0, spread: 1 } }), 'war'),
  false,
  'negative: a feature with no background is omitted',
)

console.log('zScores: ok')
