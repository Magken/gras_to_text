/**
 * Sentence marks split text. An abbreviation period does not.
 * Run: npx tsx projects/gras_to_text/tests/input/splitSentences.unit.mjs
 */
import assert from 'node:assert/strict'
import { splitSentences } from '../../ts/src/input/splitSentences.ts'

assert.deepEqual(splitSentences('Wait! Now?'), ['Wait!', 'Now?'])
assert.deepEqual(splitSentences('Dr. Smith left. He went home.'), [
  'Dr. Smith left.',
  'He went home.',
])
assert.deepEqual(
  splitSentences('Dr. Smith'),
  ['Dr. Smith'],
  'negative: Dr. is not its own sentence',
)

assert.deepEqual(splitSentences('“No.” He left.'), ['“No.”', 'He left.'], 'a sentence ends after its closing quote')
assert.deepEqual(splitSentences('“I shall go.” “You will not.”'), ['“I shall go.”', '“You will not.”'], 'two quoted sentences in a row split')
assert.deepEqual(splitSentences('"Stop!" Then silence.'), ['"Stop!"', 'Then silence.'], 'straight quotes close a sentence too')
assert.deepEqual(splitSentences('“Is it going?” she asked.'), ['“Is it going?” she asked.'], 'negative: a speech tag in lower case stays with its speech')
assert.deepEqual(splitSentences('He said “no.” twice'), ['He said “no.” twice'], 'negative: no space-and-capital after the quote, no split')

console.log('splitSentences: ok')
