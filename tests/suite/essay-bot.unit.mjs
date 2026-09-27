/**
 * The essay, tagged, with its dictionary and its sentence shapes.
 * Writes everything a bot would receive: the generation sheet, the rewrite sheet,
 * and the repair list for the flat rewrite. Compares that text to
 * expected/essay-bot.txt and prints a line diff when they differ.
 * Then scores essay-repaired.txt, written by following only the rewrite sheet
 * and the repair list, and requires it to beat the flat rewrite.
 *
 * Rewrite the expected file on purpose: GRAS_UPDATE_GOLDEN=1 npx tsx ../tests/suite/essay-bot.unit.mjs
 */
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profile, render, reportMisses, score } from '../../ts/src/index.ts'
import { lengthGap, movedMisses } from './distance.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(here, 'texts', name), 'utf8')
const essay = read('essay.txt')
const flat = read('essay-flat.txt')
const repaired = read('essay-repaired.txt')

const card = await profile(essay, { tag: true })
const generate = render(card, 'prose', { mode: 'generate' })
const regenerate = render(card, 'prose', { mode: 'regenerate' })
const flatMisses = await score(flat, card, { tag: true })
const flatReport = reportMisses(flatMisses, { mode: 'regenerate' })
const repairedMisses = await score(repaired, card, { tag: true })
const repairedReport = reportMisses(repairedMisses, { mode: 'regenerate' })

assert.ok((card.content.words ?? []).length > 0, 'the essay builds a word dictionary')
assert.ok((card.content.names ?? []).some((entry) => entry.name === 'Dr. Hale'), 'names keep their case and title')
assert.ok((card.syntactic.arrangements ?? []).length >= 3, 'the essay builds several sentence shapes')
assert.match(generate, /Vary the sentence shapes/)
assert.doesNotMatch(generate, /Keep these subject words/, 'negative: generation does not push the subject')
assert.match(regenerate, /Keep these subject words/)
assert.match(regenerate, /Keep these names as written/)
assert.doesNotMatch(generate, /\d+\.\d{2,}/, 'negative: no long decimals in the bot text')
assert.match(generate, /copy how they are built, not their people, places, or things/)
assert.doesNotMatch(generate, /is used as|noun then noun/, 'negative: no glue roles or tag chains in the bot text')
assert.doesNotMatch(reportMisses(flatMisses), /subject words|dropped these names/, 'negative: a repair for a new text does not ask for the source subject')
assert.match(flatReport, /The reply dropped these subject words/, 'a rewrite is told which subject words it dropped')
assert.match(generate, /The long sentences \(19 words or more\) cluster: about \d in 10 paragraphs hold two or more/, 'the sheet says how the long sentences cluster')
assert.match(generate, /paragraphs end on a short sentence; the other \d+ in 10 end on a longer one\.(?: [^."]+\.)? Such as: "/, 'the sheet says how paragraphs end, both ways, with a source closer')
assert.doesNotMatch(generate, /\.\"\./, 'negative: no doubled full stop after a quote')
const person = (card.syntactic.arrangements ?? []).find((item) => item.example.startsWith('Mr. Pell wanted'))
assert.equal(person?.chain.startsWith('name then'), true, 'Mr. Pell opens on one name slot')
const joined = flatMisses.find((miss) => miss.feature === 'joins.joined')
assert.ok(joined && joined.target - joined.actual >= 0.2, 'the flat rewrite stopped joining clauses')
assert.match(flatReport, /^The reply moved: it cut the sentences short, stopped joining clauses/)
assert.match(flatReport, /Paragraph \d+\. The reply says it in/)
assert.match(flatReport, /Keep: /)
assert.ok(flatReport.split('\n').filter((line) => /^\d+\. /.test(line)).length <= 8)

const flatMoved = movedMisses(flatMisses).length
const repairedMoved = movedMisses(repairedMisses).length
assert.ok(repairedMoved < flatMoved, `the repair that followed the bot text has fewer misses (${repairedMoved} < ${flatMoved})`)
assert.ok(lengthGap(repairedMisses) < lengthGap(flatMisses) / 2, 'the repair closes most of the sentence-length gap')

const shapes = (card.syntactic.arrangements ?? []).slice(0, 8).map((item) => (
  `${item.count}\t${item.type}\t${item.chain}\tparagraphs ${item.paragraphs.join(', ')}\ttopics ${item.topics.join(', ') || '(spread across the text)'}\n\t${item.example}`
))
const subjects = (card.content.words ?? []).slice(0, 12).map((word) => (
  `${word.count}\t${word.word}\t${word.uses.map((use) => `${use.tag} ${use.count}`).join(', ')}`
))
const names = (card.content.names ?? []).map((entry) => `${entry.count}\t${entry.name}`)

const actual = [
  'Essay difference. The source is essay.txt. The flat reply is essay-flat.txt. The repaired reply is essay-repaired.txt.',
  'All three were tagged. The dictionary and the sentence shapes come from the source.',
  '',
  '=== Dictionary: words with the tags they take ===',
  ...subjects,
  '',
  '=== Dictionary: names ===',
  ...names,
  '',
  '=== Arrangement dictionary: sentence shapes ===',
  ...shapes,
  '',
  '=== What goes to the bot: write a new text in this shape (generate) ===',
  generate,
  '',
  '=== What goes to the bot: rewrite the source (regenerate) ===',
  regenerate,
  '',
  '=== What goes to the bot: the flat reply versus the source ===',
  flatReport,
  '',
  `=== The repaired reply versus the source (misses ${flatMoved} -> ${repairedMoved}) ===`,
  repairedReport,
  '',
].join('\n')

const outDir = join(here, '..', '..', '_tmp-suite-results')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'essay-bot.txt'), actual, 'utf8')

/** Line diff by longest common subsequence: "-" is expected only, "+" is actual only. */
function lineDiff(expected, got) {
  const a = expected.split('\n')
  const b = got.split('\n')
  const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const out = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push(`- ${a[i++]}`)
    } else {
      out.push(`+ ${b[j++]}`)
    }
  }
  while (i < a.length) out.push(`- ${a[i++]}`)
  while (j < b.length) out.push(`+ ${b[j++]}`)
  return out
}

const goldenPath = join(here, 'expected', 'essay-bot.txt')
if (process.env.GRAS_UPDATE_GOLDEN === '1' || !existsSync(goldenPath)) {
  mkdirSync(dirname(goldenPath), { recursive: true })
  writeFileSync(goldenPath, actual, 'utf8')
  console.log(`essay-bot: wrote ${goldenPath}`)
} else {
  const expected = readFileSync(goldenPath, 'utf8').replace(/\r\n/g, '\n')
  if (expected !== actual) {
    const diff = lineDiff(expected, actual)
    writeFileSync(join(outDir, 'essay-bot.diff.txt'), diff.join('\n'), 'utf8')
    console.log(diff.join('\n'))
    assert.fail(`the bot text drifted from expected/essay-bot.txt (${diff.length} lines). Rerun with GRAS_UPDATE_GOLDEN=1 if the change is meant.`)
  }
}

console.log(`essay-bot: ok (misses ${flatMoved} -> ${repairedMoved})`)
