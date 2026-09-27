/**
 * A zero rate is not a feature the guide should name.
 * Run: npx tsx projects/gras_to_text/tests/profile/select.unit.mjs
 */
import assert from 'node:assert/strict'
import { selectFeatures } from '../../ts/src/profile/select.ts'

assert.deepEqual(selectFeatures({ the: 0.2, of: 0, upon: -1 }), ['the', 'upon'])
assert.deepEqual(selectFeatures({ of: 0, the: 0 }), [], 'negative: a zero rate is not a feature')

console.log('selectFeatures: ok')
