/**
 * Does the profile tell one writer from another? Each text is cut in half by paragraphs.
 * The first half builds the profile; the second half of the same writer must sit closer
 * than the other writer's second half. Two measures, both style only:
 * the misses that would become repairs (subject words and paragraph pairing left out),
 * and Burrows Delta over the filler words, with the four halves as the background.
 *
 * texts/essay.txt is the suite essay. texts/austen.txt is the opening of Pride and Prejudice
 * (Jane Austen, 1813; public domain, Project Gutenberg #1342), chapter headings removed.
 * Writes _tmp-suite-results/heldout.txt.
 */
import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { profile, score } from '../../ts/src/index.ts'
import { burrowsDelta } from '../../ts/src/measures/burrowsDelta.ts'
import { zScores } from '../../ts/src/measures/contrast.ts'
import { movedMisses } from './distance.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const halves = (name) => {
  const paragraphs = readFileSync(join(here, 'texts', name), 'utf8').replace(/\r\n/g, '\n').split(/\n\s*\n/).filter((p) => p.trim())
  const cut = Math.ceil(paragraphs.length / 2)
  return [paragraphs.slice(0, cut).join('\n\n'), paragraphs.slice(cut).join('\n\n')]
}
const [essayA, essayB] = halves('essay.txt')
const [austenA, austenB] = halves('austen.txt')
const tagged = { tag: true }

const rates = async (text) => Object.fromEntries((await profile(text, { tag: false })).lexical.functionWords.map((word) => [word.feature, word.rate]))
const chunks = { essayA, essayB, austenA, austenB }
const allRates = Object.fromEntries(await Promise.all(Object.entries(chunks).map(async ([key, text]) => [key, await rates(text)])))
const background = {}
for (const feature of Object.keys(allRates.essayA)) {
  const values = Object.values(allRates).map((r) => r[feature] ?? 0)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const spread = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length)
  if (spread > 0) background[feature] = { mean, spread }
}
const delta = (a, b) => burrowsDelta(zScores(allRates[a], background), zScores(allRates[b], background))

const essayCard = await profile(essayA, tagged)
const austenCard = await profile(austenA, tagged)
const style = async (text, card) => movedMisses(await score(text, card, tagged), { style: true })

const rows = {
  'essay profile, essay held-out half': { moved: await style(essayB, essayCard), delta: delta('essayA', 'essayB') },
  'essay profile, Austen half': { moved: await style(austenB, essayCard), delta: delta('essayA', 'austenB') },
  'Austen profile, Austen held-out half': { moved: await style(austenB, austenCard), delta: delta('austenA', 'austenB') },
  'Austen profile, essay half': { moved: await style(essayB, austenCard), delta: delta('austenA', 'essayB') },
}

const lines = ['Held-out check: the first half of each text builds the profile.', '']
for (const [name, row] of Object.entries(rows)) {
  lines.push(`${name}: ${row.moved.length} style misses, Delta ${row.delta.toFixed(2)}`)
  lines.push(`  ${row.moved.map((miss) => miss.feature).join(', ') || '(none)'}`)
}
const outDir = join(here, '..', '..', '_tmp-suite-results')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'heldout.txt'), `${lines.join('\n')}\n`, 'utf8')

const r = Object.values(rows)
assert.equal((await style(essayA, essayCard)).length, 0, 'negative: a half scored against its own profile has no style misses')
assert.ok(r[0].moved.length < r[1].moved.length, `the essay's own held-out half has fewer style misses (${r[0].moved.length} < ${r[1].moved.length})`)
assert.ok(r[2].moved.length < r[3].moved.length, `Austen's own held-out half has fewer style misses (${r[2].moved.length} < ${r[3].moved.length})`)
assert.ok(r[0].delta < r[1].delta, 'Delta puts the essay halves together')
assert.ok(r[2].delta < r[3].delta, 'Delta puts the Austen halves together')

console.log(`heldout: ok (essay ${r[0].moved.length} vs ${r[1].moved.length}, Austen ${r[2].moved.length} vs ${r[3].moved.length})`)
