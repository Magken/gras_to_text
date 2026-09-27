/**
 * Blank lines split paragraphs. A single line break does not.
 * Run: npx tsx projects/gras_to_text/tests/input/splitParagraphs.unit.mjs
 */
import assert from 'node:assert/strict'
import { splitParagraphs } from '../../ts/src/input/splitParagraphs.ts'

assert.deepEqual(splitParagraphs('One.\n\nTwo.'), ['One.', 'Two.'])
assert.deepEqual(splitParagraphs(''), [])
assert.deepEqual(
  splitParagraphs('One.\nTwo.'),
  ['One.\nTwo.'],
  'negative: one line break is still one paragraph',
)

console.log('splitParagraphs: ok')
