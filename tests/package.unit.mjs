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
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
const dependabot = readFileSync(join(root, '.github/dependabot.yml'), 'utf8')
const tsPkg = JSON.parse(readFileSync(join(root, 'ts/package.json'), 'utf8'))
const server = JSON.parse(readFileSync(join(root, 'ts/server.json'), 'utf8'))

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
assert.match(changelog, /# Changelog/)
assert.match(changelog, /\| Date \| Change \|/)
assert.match(changelog, /2026-09-27/)
assert.equal(
  /\|\s*2099-/.test(changelog),
  false,
  'negative: changelog dates are days work actually landed',
)
assert.match(dependabot, /package-ecosystem:\s*npm/)
assert.match(dependabot, /directory:\s*\/ts/)
assert.match(dependabot, /interval:\s*weekly/)
assert.equal(
  /auto-?merge/i.test(dependabot),
  false,
  'negative: Dependabot must not auto-merge',
)
assert.equal(tsPkg.version, '0.1.0')
assert.equal(server.version, tsPkg.version)
assert.equal(server.packages[0].version, tsPkg.version)
assert.equal(
  tsPkg.version === '0.0.0',
  false,
  'negative: a published GitHub version is not 0.0.0',
)

console.log('gras_to_text package: ok')
