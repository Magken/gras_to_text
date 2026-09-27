/**
 * The public calls exist, and the tool list names them.
 * Run: npm test
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildDictionary, profile, render, score } from '../ts/src/index.ts'

assert.equal(typeof profile, 'function')
assert.equal(typeof render, 'function')
assert.equal(typeof score, 'function')
assert.equal(typeof buildDictionary, 'function')

const tools = JSON.parse(
  fs.readFileSync(new URL('../spec/tools.json', import.meta.url), 'utf8'),
)
const names = tools.tools.map((tool) => tool.name)
assert.deepEqual(names, ['profile', 'render', 'score'])

assert.equal(
  tools.tools.some((tool) => tool.name === 'instructions'),
  false,
  'negative: the tool list is not a prose prompt',
)

console.log('gras_to_text: ok')
