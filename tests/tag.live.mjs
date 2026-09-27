/**
 * Tags one sentence with the English BERT model. The first run downloads it.
 * Not part of npm test. Run: npx tsx projects/gras_to_text/tests/tag.live.mjs
 */
import assert from 'node:assert/strict'
import { tagLabel } from '../ts/src/measures/syntax.ts'
import { profile } from '../ts/src/index.ts'

const card = await profile('The cat sat.')
assert.equal(tagLabel(card.syntactic.sentenceStarts[0]), 'determiner', 'The is a determiner')
const sentence = card.guide.find((step) => step.level === 'sentence')
assert.equal(sentence.text.includes('determiner'), true)
console.log('tag live: ok')
console.log(sentence.text)
