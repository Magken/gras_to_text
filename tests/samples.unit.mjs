/**
 * Long samples. Prints the hierarchy and the text a bot would receive.
 * Run: npx tsx projects/gras_to_text/tests/samples.unit.mjs
 */
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tagLabel } from '../ts/src/measures/syntax.ts'
import { profile, render, reportMisses, score } from '../ts/src/index.ts'

const offline = { tag: false }

function modelCached() {
  const root = fileURLToPath(new URL('../ts/.cache', import.meta.url))
  if (!existsSync(root)) return false
  const pending = [root]
  while (pending.length > 0) {
    const dir = pending.pop()
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.includes('bert-english-uncased-finetuned-pos')) return true
      if (entry.isDirectory()) pending.push(path.join(dir, entry.name))
    }
  }
  return false
}

const fixture = (name) => readFileSync(new URL(`../spec/fixtures/samples/${name}`, import.meta.url), 'utf8')

const cases = [
  { name: 'Paste', input: fixture('paste.txt') },
  { name: 'Letter', input: fixture('letter.txt') },
  { name: 'Harbor', input: fixture('harbor.md') },
  { name: 'Annotated queue', input: fixture('annotated.json') },
]

console.log('\n=== sample suite ===\n')
const cards = []
for (const sample of cases) {
  const card = await profile(sample.input, offline)
  cards.push(card)
  console.log(`--- ${sample.name} ---`)
  console.log(`hierarchy: ${card.guide.map((step) => step.level).join(' → ')}`)
  console.log(render(card))
  console.log('')
}

const harbor = cards[2]
const flat = fixture('harbor-flat.txt')
const misses = await score(flat, harbor, offline)
console.log('--- Harbor against the flat rewrite ---')
console.log(`hierarchy: ${harbor.guide.map((step) => step.level).join(' → ')}`)
console.log(reportMisses(misses))
console.log('')

assert.deepEqual(cards[0].guide.map((step) => step.level), ['paragraph', 'sentence', 'word'])
assert.equal(cards[1].guide.some((step) => step.level === 'chapter'), false, 'negative: a letter is not a chapter')
assert.equal(cards[2].guide[0].level, 'chapter')
assert.equal(cards[2].guide.filter((step) => step.level === 'chapter').length, 2)
assert.equal(cards[3].syntactic.sentenceStarts[0], 'DT')
assert.equal(render(cards[0]).includes('Chapter.'), false)
assert.equal(reportMisses(misses).includes('Sentence.'), true)
assert.equal(
  reportMisses(await score(fixture('harbor.md'), harbor, offline), { mode: 'regenerate' }).includes('The measured shape matches.'),
  true,
  'negative: the same harbor text is not a miss',
)

if (modelCached()) {
  const live = await profile('The cat sat.')
  const line = live.guide.find((step) => step.level === 'sentence')
  console.log('--- Live tagger ---')
  console.log(line.text)
  console.log(`opens with ${live.syntactic.sentenceStarts.join(', ')}`)
  console.log('')
  assert.equal(tagLabel(live.syntactic.sentenceStarts[0]), 'determiner')
  assert.equal(line.text.includes('Open by naming the thing'), true)
} else {
  console.log('live tagger: cache not present')
  console.log('')
}

console.log('samples: ok')
