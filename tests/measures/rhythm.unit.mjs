/**
 * Quartiles of sentence length in words.
 * Run: npx tsx projects/gras_to_text/tests/measures/rhythm.unit.mjs
 */
import assert from 'node:assert/strict'
import { afterLongShare, sentenceRhythm, spokenLengths } from '../../ts/src/measures/rhythm.ts'

const rhythm = sentenceRhythm(['A.', 'One two three four.', 'One two.'])
assert.equal(rhythm.q1, 1.5)
assert.equal(rhythm.q2, 2)
assert.equal(rhythm.q3, 3)

const one = sentenceRhythm(['Hello.'])
assert.equal(one.q1, 1)
assert.equal(one.q2, 1)
assert.equal(one.q3, 1, 'negative: one sentence is not a zero length')

assert.equal(afterLongShare([20, 3, 10, 20, 12, 20, 4], 6, 19), 2 / 3, 'two of three long sentences are followed by a short one')
assert.equal(afterLongShare([20, 10, 20, 12, 3], 6, 19), 0, 'negative: short sentences between middling ones do not count')
assert.equal(afterLongShare([5, 20], 6, 19), 0, 'negative: a long sentence at the end has no next sentence')
assert.equal(rhythm.afterLong, 0, 'the profile carries the share')

const talk = [
  '“I shall not go,” she said, “whatever the weather may do to the roads this week.',
  'You may tell him so, and you may tell him why.”',
  'He left.',
  '“Then I will go myself, and I will take the carriage if it is free.”',
  '“Do as you please, since you always do as you please in the end.”',
  '“I mean to, and I mean to be back before the rain.”',
]
assert.deepEqual(spokenLengths(talk), [16, 11, 15, 14, 12], 'a quote that runs on into the next sentence counts both; narration does not')
assert.equal(sentenceRhythm(talk).spoken, 14, 'the profile keeps the typical spoken length')
assert.equal(sentenceRhythm(['The kiln cooled.', 'The yard was empty.', 'A bell rang.', 'Nobody came.', 'It rained.']).spoken, undefined, 'negative: no speech, no spoken length')
assert.equal(sentenceRhythm(['“Go.”', ...Array.from({ length: 9 }, () => 'The yard was empty.')]).spoken, undefined, 'negative: one line of speech is too little to measure')

console.log('sentenceRhythm: ok')
