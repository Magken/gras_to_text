/**
 * Punctuation is split off the word. The word itself stays whole.
 * Run: npx tsx projects/gras_to_text/tests/input/tokenizeWords.unit.mjs
 */
import assert from 'node:assert/strict'
import { tokenizeWords } from '../../ts/src/input/tokenizeWords.ts'

assert.deepEqual(tokenizeWords("Hello, world."), ['Hello', ',', 'world', '.'])
assert.deepEqual(tokenizeWords("Don't"), ["Don't"])
assert.deepEqual(
  tokenizeWords('bill.'),
  ['bill', '.'],
  'negative: the period is not part of the word',
)

console.log('tokenizeWords: ok')
