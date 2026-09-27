/**
 * Changelog rules stay written in CHANGELOG.md and CONTRIBUTING.md.
 * Run: npx tsx ../tests/changelog.unit.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
const contributing = readFileSync(join(root, 'CONTRIBUTING.md'), 'utf8')
const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')

assert.match(changelog, /## How to update this file/)
assert.match(changelog, /Add a row the same day/)
assert.match(changelog, /Do not rewrite or delete old rows/)
assert.match(changelog, /\| Date \| Change \|/)
assert.match(contributing, /## Changelog/)
assert.match(contributing, /Do not edit or delete older rows/)
assert.match(agents, /CHANGELOG\.md/)
assert.equal(
  contributing.includes('## Changelog') && contributing.indexOf('## Changelog') < contributing.indexOf('## Pull request checklist'),
  true,
)
assert.equal(
  changelog.includes('| TBD |'),
  false,
  'negative: changelog rows use a real date, not TBD',
)

console.log('gras_to_text changelog: ok')
