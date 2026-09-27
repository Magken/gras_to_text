/**
 * The profile is the sections from the notes, plus a guide sheet.
 * Run: npx tsx projects/gras_to_text/tests/card.schema.unit.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

const schema = JSON.parse(
  fs.readFileSync(new URL('../spec/card.schema.json', import.meta.url), 'utf8'),
)

assert.deepEqual(schema.required, [
  'lexical',
  'syntactic',
  'semantic',
  'functional',
  'structural',
  'content',
  'language',
  'guide',
])
assert.deepEqual(schema.properties.lexical.required, ['functionWords', 'diversity', 'rhythm'])
assert.deepEqual(schema.properties.guide.items.properties.level.enum, [
  'chapter',
  'section',
  'paragraph',
  'sentence',
  'word',
])
assert.equal(
  Object.hasOwn(schema.properties, 'constructions'),
  false,
  'negative: constructions are not a profile section',
)
assert.equal(
  Object.hasOwn(schema.properties, 'exemplars'),
  false,
  'negative: an excerpt sits on a guide step, not in its own list',
)

console.log('card.schema: ok')
