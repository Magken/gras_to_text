/**
 * Command flags, output paths, and file formats for the CLI.
 * Run: npx tsx projects/gras_to_text/tests/cli.unit.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { formatBody, parseArgs, resolveOut, runCli } from '../ts/src/cli.ts'

const profile = parseArgs(['profile', '--file', 'essay.txt', '--out', 'sheet.md'])
assert.equal(profile.command, 'profile')
assert.equal(profile.file, 'essay.txt')
assert.equal(profile.out, 'sheet.md')
assert.equal(profile.format, 'md')
assert.equal(profile.tag, false)

const inline = parseArgs(['profile', 'The', 'lamp', 'stood.'])
assert.equal(inline.text, 'The lamp stood.')
assert.equal(inline.file, undefined)

const scored = parseArgs(['score', '--sample', 'a.txt', '--reply', 'b.txt', '--json', '--mode', 'regenerate'])
assert.equal(scored.command, 'score')
assert.equal(scored.sample, 'a.txt')
assert.equal(scored.reply, 'b.txt')
assert.equal(scored.format, 'json')
assert.equal(scored.mode, 'regenerate')

const dict = parseArgs(['dictionary', '--add', 'a.txt', '--add', 'b.txt', '--in', 'old.json', '--out', 'voice.json'])
assert.deepEqual(dict.add, ['a.txt', 'b.txt'])
assert.equal(dict.in, 'old.json')
assert.equal(dict.format, 'json')

assert.throws(() => parseArgs(['profile']), /pass --file or the text/)
assert.throws(() => parseArgs(['score', '--sample', 'a.txt']), /--reply/)
assert.throws(() => parseArgs(['profile', '--file', 'a.txt', '--json', '--md']), /one format/)
assert.throws(() => parseArgs(['look']), /profile, score, or dictionary/)
assert.throws(() => parseArgs(['dictionary', '--out', 'voice.json']), /--add/)

const outputDir = join(tmpdir(), 'gras-out')
assert.equal(resolveOut('sheet.md', outputDir, process.cwd()), join(outputDir, 'sheet.md'))
assert.equal(resolveOut(join(outputDir, 'kept.md'), outputDir, process.cwd()), join(outputDir, 'kept.md'))
assert.throws(() => resolveOut('sheet.pdf', outputDir, process.cwd()), /\.txt, \.md, or \.json/)

assert.match(formatBody('Write in this shape.', 'md', 'profile'), /^# Writing sheet\n\nWrite in this shape\.\n$/)
assert.equal(formatBody('Write in this shape.', 'txt', 'profile'), 'Write in this shape.\n')
assert.equal(formatBody('{"a":1}', 'json', 'profile'), '{"a":1}\n')
assert.doesNotMatch(formatBody('Write in this shape.', 'txt', 'profile'), /^# /, 'negative: a txt file has no markdown heading')

const dir = mkdtempSync(join(tmpdir(), 'gras-cli-'))
const output = join(dir, 'output')
mkdirSync(output)
const sample = join(dir, 'sample.txt')
const reply = join(dir, 'reply.txt')
writeFileSync(sample, 'The lamp stood in the window.\n\nIt had stood there for years.', 'utf8')
writeFileSync(reply, 'A light sat on the sill.\n\nThe room was quiet.', 'utf8')

const printed = []
const made = await runCli({
  argv: ['profile', '--file', sample, '--out', 'sheet.md'],
  outputDir: output,
  log: (line) => printed.push(line),
})
assert.equal(made.path, join(output, 'sheet.md'))
assert.match(readFileSync(made.path, 'utf8'), /# Writing sheet/)
assert.match(printed[0], /wrote /)

const targeted = join(output, 'reuse.txt')
writeFileSync(targeted, 'old', 'utf8')
await runCli({
  argv: ['profile', '--file', sample, '--out', targeted],
  outputDir: output,
  log: () => {},
})
assert.match(readFileSync(targeted, 'utf8'), /Write in this shape/)
assert.doesNotMatch(readFileSync(targeted, 'utf8'), /^# /, 'targeting a txt file keeps it as plain text')

const compared = await runCli({
  argv: ['score', '--sample', sample, '--reply', reply, '--out', 'repair.md'],
  outputDir: output,
  log: () => {},
})
assert.match(readFileSync(compared.path, 'utf8'), /# Repair list/)

const voice = await runCli({
  argv: ['dictionary', '--add', sample, '--out', 'voice.json'],
  outputDir: output,
  log: () => {},
})
const stored = JSON.parse(readFileSync(voice.path, 'utf8'))
assert.equal(typeof stored, 'object')
assert.equal(Array.isArray(stored), false, 'negative: a dictionary is an object, not a list')

const stdout = []
await runCli({
  argv: ['profile', 'The lamp stood.'],
  outputDir: output,
  log: (line) => stdout.push(line),
})
assert.equal(stdout.some((line) => line.includes('output')), false, 'negative: no --out prints the sheet, and writes nothing')
assert.match(stdout.join('\n'), /Write in this shape/)

console.log('cli: ok')
