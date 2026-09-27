/**
 * The standalone repository installs from its root: MIT license, npm install
 * installs ts/, and the public Agent Skill copies stay identical.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const license = readFileSync(join(root, 'LICENSE'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const ignore = readFileSync(join(root, '.gitignore'), 'utf8')
const readme = readFileSync(join(root, 'README.md'), 'utf8')
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
const dependabot = readFileSync(join(root, '.github/dependabot.yml'), 'utf8')
const mcpExample = readFileSync(join(root, 'spec/mcp.example.json'), 'utf8')
const tsPkg = JSON.parse(readFileSync(join(root, 'ts/package.json'), 'utf8'))
const server = JSON.parse(readFileSync(join(root, 'ts/server.json'), 'utf8'))

assert.match(license, /MIT License/)
assert.match(license, /Permission is hereby granted/)
assert.equal(pkg.license, 'MIT')
assert.equal(pkg.scripts.prepare, 'npm install --prefix ts')
assert.equal(pkg.scripts.test, 'npm test --prefix ts')
assert.equal(pkg.scripts.check, 'npm run check --prefix ts')
assert.equal(ignore.includes('research/papers/'), true)
assert.match(ignore, /ts\/skills\//)
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
assert.equal(tsPkg.version, '0.1.1')
assert.equal(server.version, tsPkg.version)
assert.equal(server.packages[0].version, tsPkg.version)
assert.equal(tsPkg.name, '@graslabs/gras_to_text')
assert.equal(
  Boolean(tsPkg.private),
  false,
  'negative: the published package is not private',
)
assert.equal(tsPkg.publishConfig.access, 'public')
assert.equal(tsPkg.bin['gras-to-text-mcp'], './start-mcp.mjs')
assert.equal(server.packages[0].identifier, tsPkg.name)
assert.match(readme, /npm install @graslabs\/gras_to_text/)
assert.match(mcpExample, /@graslabs\/gras_to_text/)
assert.equal(
  tsPkg.name === '@gras/gras_to_text',
  false,
  'negative: the npm scope is graslabs, not gras',
)
assert.equal(
  readme.includes('This package is not on npm yet'),
  false,
  'negative: npm is an install path',
)
assert.equal(
  /Private on npm/.test(readme),
  false,
  'negative: the package is public on npmjs',
)

const skillFiles = [
  'SKILL.md',
  'references/repository.md',
  'references/flags.md',
]
const skillRoots = [
  'skills/gras-to-text',
  '.cursor/skills/gras-to-text',
  '.claude/skills/gras-to-text',
]
const canonical = {}
for (const rel of skillFiles) {
  canonical[rel] = readFileSync(join(root, skillRoots[0], rel), 'utf8')
}
for (const copyRoot of skillRoots.slice(1)) {
  for (const rel of skillFiles) {
    const copy = readFileSync(join(root, copyRoot, rel), 'utf8')
    assert.equal(copy, canonical[rel], `${copyRoot}/${rel} matches skills/`)
  }
}
const skill = canonical['SKILL.md']
assert.match(skill, /^---\r?\nname: gras-to-text\r?\n/)
assert.match(skill, /npm install @graslabs\/gras_to_text/)
assert.match(skill, /npx -y @graslabs\/gras_to_text/)
assert.match(skill, /Work in this repository/)
assert.match(skill, /Install this skill locally/)
assert.match(skill, /node_modules\/@graslabs\/gras_to_text\/skills\/gras-to-text/)
assert.match(skill, /references\/repository\.md/)
assert.match(skill, /Do not install from GitHub Packages/)
assert.match(skill, /Do not add `\.cursor-plugin\//)
assert.equal(
  skill.includes('name: gras_to_text'),
  false,
  'negative: the skill id uses hyphens, not underscores',
)
assert.equal(
  skill.includes('cursor.com/marketplace/publish'),
  false,
  'negative: the local skill is not published to the Cursor marketplace',
)
assert.match(canonical['references/repository.md'], /ts\/src\/measures/)
assert.match(canonical['references/flags.md'], /--file PATH/)

assert.equal(tsPkg.files.includes('skills'), true)
const copyScript = readFileSync(join(root, 'ts/copy-npm-docs.mjs'), 'utf8')
assert.match(copyScript, /skills\/gras-to-text/)
execFileSync(process.execPath, [join(root, 'ts/copy-npm-docs.mjs')], { cwd: join(root, 'ts') })
assert.equal(
  readFileSync(join(root, 'ts/skills/gras-to-text/SKILL.md'), 'utf8'),
  canonical['SKILL.md'],
  'prepublish copies the local skill into the npm package',
)

assert.equal(existsSync(join(root, 'plugin.json')), false, 'negative: no Agent plugin.json')
assert.equal(existsSync(join(root, 'mcp.json')), false, 'negative: MCP start is spec/mcp.example.json')
assert.equal(existsSync(join(root, '.cursor-plugin')), false, 'negative: no Cursor plugin folder')
assert.match(readme, /local skill/)
assert.match(readme, /skills\/gras-to-text/)
assert.equal(
  readme.includes('.cursor-plugin/marketplace.json'),
  false,
  'negative: README does not tell people to import a Cursor plugin',
)

console.log('gras_to_text package: ok')
