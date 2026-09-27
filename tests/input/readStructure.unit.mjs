/**
 * JSON may name chapters. A raw paste does not invent them.
 * Run: npx tsx projects/gras_to_text/tests/input/readStructure.unit.mjs
 */
import assert from 'node:assert/strict'
import { readStructure } from '../../ts/src/input/readStructure.ts'

const marked = readStructure(
  JSON.stringify({
    chapters: [{ title: 'One', sections: [{ title: 'A', paragraphs: ['Hello.'] }] }],
  }),
)
assert.equal(marked.chapters.length, 1)
assert.equal(marked.chapters[0].sections[0].paragraphs[0], 'Hello.')

const pasted = readStructure('Chapter 1\n\nHello.')
assert.deepEqual(pasted.paragraphs, ['Chapter 1', 'Hello.'])
assert.equal(
  pasted.chapters.length,
  0,
  'negative: a raw paste does not become a chapter',
)

console.log('readStructure: ok')
