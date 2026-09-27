/**
 * The standalone repository installs from its root: MIT license, npm install
 * installs ts/, and research PDFs stay gitignored.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const license = readFileSync(join(root, 'LICENSE'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const ignore = readFileSync(join(root, '.gitignore'), 'utf8')
const readme = readFileSync(join(root, 'README.md'), 'utf8')

assert.match(license, /MIT License/)
assert.match(license, /Permission is hereby granted/)
assert.equal(pkg.license, 'MIT')
assert.equal(pkg.scripts.prepare, 'npm install --prefix ts')
assert.equal(pkg.scripts.test, 'npm test --prefix ts')
assert.equal(pkg.scripts.check, 'npm run check --prefix ts')
assert.equal(ignore.includes('research/papers/'), true)
assert.match(readme, /cd gras_to_text\r?\nnpm install/)
assert.equal(
  /cd gras_to_text\/ts\r?\nnpm install/.test(readme),
  false,
  'negative: clone install is the package root, not ts/',
)
assert.equal(
  readme.includes('fails on purpose'),
  false,
  'negative: npm test is not left red on purpose',
)

console.log('gras_to_text package: ok')
