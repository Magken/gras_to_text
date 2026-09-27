/**
 * A paragraph shape comes from its sentences. An empty level stays empty.
 * Run: npx tsx projects/gras_to_text/tests/hierarchy/hierarchy.unit.mjs
 */
import assert from 'node:assert/strict'
import { paragraphShape, sectionShape } from '../../ts/src/hierarchy/hierarchy.ts'

const paragraph = paragraphShape([
  { wordCount: 4, startTag: 'PRP' },
  { wordCount: 2, startTag: 'NN' },
])
assert.ok(paragraph)
assert.equal(paragraph.sentenceCount, 2)
assert.equal(paragraph.meanWords, 3)
assert.equal(paragraph.openingStartTag, 'PRP')

const section = sectionShape([paragraph])
assert.ok(section)
assert.equal(section.paragraphCount, 1)
assert.equal(section.meanSentences, 2)

assert.equal(paragraphShape([]), null, 'negative: no sentences means no paragraph shape')
assert.equal(sectionShape([]), null, 'negative: no paragraphs means no section shape')

console.log('hierarchy: ok')
