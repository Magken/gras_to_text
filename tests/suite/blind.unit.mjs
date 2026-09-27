/**
 * Blind writer check. Writers who never saw the essay wrote 13 paragraphs on the same
 * new subject (a night shift at a harbour bakery). Fresh agent sessions with no access
 * to the repo, run 2026-09-26:
 *   texts/blind-with-first.txt  the first sheet (a bare "Lean on" word list, no copy rule)
 *   texts/blind-with.txt        the revised sheet (glue rates, rare words named, copy rule)
 *   texts/blind-without.txt     a one-line brief, no sheet
 *
 * The revised sheet must move the writer toward the source's style (fewer style misses,
 * lower Delta). The copy check must catch what the first sheet writer lifted from the
 * examples, and the revised sheet must cut that copying. Writes _tmp-suite-results/blind.txt.
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profile, reportMisses, score } from '../../ts/src/index.ts'
import { burrowsDelta } from '../../ts/src/measures/burrowsDelta.ts'
import { zScores } from '../../ts/src/measures/contrast.ts'
import { movedMisses } from './distance.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(here, 'texts', name), 'utf8')
const essay = read('essay.txt')
const withSheet = read('blind-with.txt')
const withoutSheet = read('blind-without.txt')
const firstSheet = read('blind-with-first.txt')
const austen = read('austen.txt')
const tagged = { tag: true }

const card = await profile(essay, tagged)
const withMisses = await score(withSheet, card, tagged)
const withoutMisses = await score(withoutSheet, card, tagged)
const withStyle = movedMisses(withMisses, { style: true })
const withoutStyle = movedMisses(withoutMisses, { style: true })

const rates = async (text) => Object.fromEntries((await profile(text, { tag: false })).lexical.functionWords.map((word) => [word.feature, word.rate]))
const all = { essay: await rates(essay), withSheet: await rates(withSheet), withoutSheet: await rates(withoutSheet), austen: await rates(austen) }
const background = {}
for (const feature of Object.keys(all.essay)) {
  const values = Object.values(all).map((r) => r[feature] ?? 0)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const spread = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)
  if (spread > 0) background[feature] = { mean, spread }
}
const delta = (key) => burrowsDelta(zScores(all.essay, background), zScores(all[key], background))

const firstMisses = await score(firstSheet, card, tagged)
const copiedFirst = firstMisses.find((miss) => miss.feature === 'copied')
const copiedWith = withMisses.find((miss) => miss.feature === 'copied')
const copiedWithout = withoutMisses.find((miss) => miss.feature === 'copied')
const firstReport = reportMisses(firstMisses)
const report = reportMisses(withMisses)

const lines = [
  'Blind writer check against essay.txt.',
  `with the sheet: ${withStyle.length} style misses, Delta ${delta('withSheet').toFixed(2)}, ${copiedWith.actual} copied phrases`,
  `  ${withStyle.map((miss) => miss.feature).join(', ')}`,
  `  copied: ${copiedWith.note ?? '(none)'}`,
  `without the sheet: ${withoutStyle.length} style misses, Delta ${delta('withoutSheet').toFixed(2)}, ${copiedWithout.actual} copied phrases`,
  `  ${withoutStyle.map((miss) => miss.feature).join(', ')}`,
  `  copied: ${copiedWithout.note ?? '(none)'}`,
  `first sheet: ${copiedFirst.actual} copied phrases: ${copiedFirst.note ?? '(none)'}`,
  '',
  '=== Repair list for the revised sheet writer (generate) ===',
  report,
  '',
  '=== Repair list for the first sheet writer (generate) ===',
  firstReport,
  '',
]
const outDir = join(here, '..', '..', '_tmp-suite-results')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'blind.txt'), lines.join('\n'), 'utf8')

assert.ok(withStyle.length < withoutStyle.length, `the sheet writer has fewer style misses (${withStyle.length} < ${withoutStyle.length})`)
assert.ok(delta('withSheet') < delta('withoutSheet'), 'the sheet writer sits closer by Delta')
assert.ok(copiedFirst.actual >= 2, 'the copy check catches the phrases the first sheet writer lifted')
assert.match(copiedFirst.note, /set them down too hard/)
assert.match(firstReport.split('\n')[1], /^1\. Content\. The reply copies phrases from the source's examples: /, 'copying is the first repair for a new text')
assert.doesNotMatch(reportMisses(firstMisses, { mode: 'regenerate' }), /copies phrases/, 'negative: a rewrite may reuse the source')
assert.ok(copiedWith.actual < copiedFirst.actual, `the copy rule on the revised sheet cut the copying (${copiedWith.actual} < ${copiedFirst.actual})`)
assert.ok(copiedWithout.actual <= 1, 'negative: the writer who never saw the examples copies almost nothing')

console.log(`blind: ok (style ${withStyle.length} vs ${withoutStyle.length}, Delta ${delta('withSheet').toFixed(2)} vs ${delta('withoutSheet').toFixed(2)}, copied ${copiedFirst.actual} -> ${copiedWith.actual})`)
