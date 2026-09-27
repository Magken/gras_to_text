/**
 * WordPiece pieces join back onto the whole word. The first piece keeps the tag.
 * Run: npx tsx projects/gras_to_text/tests/profile/glueWordPieces.unit.mjs
 */
import assert from 'node:assert/strict'
import { glueWordPieces } from '../../ts/src/profile/glueWordPieces.ts'

assert.deepEqual(
  glueWordPieces([
    { word: 'play', tag: 'NN' },
    { word: '##ing', tag: 'VBG' },
  ]),
  [{ word: 'playing', tag: 'NN' }],
)

assert.deepEqual(
  glueWordPieces([
    { word: 'cat', tag: 'NN' },
    { word: 'sat', tag: 'VBD' },
  ]),
  [
    { word: 'cat', tag: 'NN' },
    { word: 'sat', tag: 'VBD' },
  ],
)

assert.deepEqual(
  glueWordPieces([
    { word: '##ing', tag: 'VBG' },
    { word: 'cat', tag: 'NN' },
  ]),
  [
    { word: '##ing', tag: 'VBG' },
    { word: 'cat', tag: 'NN' },
  ],
  'negative: a continuation with no head does not glue onto the next word',
)

console.log('glueWordPieces: ok')
