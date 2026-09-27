/**
 * Delta is the sum of absolute z-score gaps. The same list is zero.
 * Run: npx tsx projects/gras_to_text/tests/measures/burrowsDelta.unit.mjs
 */
import assert from 'node:assert/strict'
import { burrowsDelta } from '../../ts/src/measures/burrowsDelta.ts'

assert.equal(burrowsDelta({ the: 1, of: -1 }, { the: -1, of: 1 }), 4)
assert.equal(
  burrowsDelta({ the: 1, of: -1 }, { the: 1, of: -1 }),
  0,
  'negative: identical lists are not a gap',
)

console.log('burrowsDelta: ok')
