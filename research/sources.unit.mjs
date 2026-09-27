/**
 * The reading list cites every paper at a URL. Copies are not in the repository.
 * Run: node projects/gras_to_text/research/sources.unit.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const sources = fs.readFileSync(path.join(dir, 'sources.md'), 'utf8')
const ignore = fs.readFileSync(path.join(dir, '..', '.gitignore'), 'utf8')

const citations = [
  { file: 'jurafsky-martin-pos-viterbi.pdf', url: 'https://web.stanford.edu/~jurafsky/slp3/old_oct19/8.pdf' },
  { file: 'mosteller-wallace-1963.pdf', url: 'https://gwern.net/doc/statistics/bayes/1963-mosteller.pdf' },
  { file: 'stamatatos-2009-survey.pdf', url: 'https://www.clips.uantwerpen.be/~walter/educational/material/Stamatatos_survey2009.pdf' },
  { file: 'jannidis-2015-burrows-delta.pdf', url: 'https://aclanthology.org/W15-0709.pdf' },
  { file: 'keselj-2003-ngram-profiles.pdf', url: 'https://web.cs.dal.ca/~vlado/papers/pacling03.pdf' },
  { file: 'baayen-1996-syntax.pdf', url: 'https://quantling.org/~hbaayen/publications/BaayenHalterenTweedie1996.pdf' },
]

assert.match(sources, /does not include the PDFs/)
assert.equal(ignore.includes('research/papers/'), true, 'research/papers/ is gitignored')
for (const { file, url } of citations) {
  assert.equal(sources.includes(file), true, file)
  assert.equal(sources.includes(url), true, url)
}
assert.equal(
  sources.includes('part of this repository'),
  false,
  'negative: the reading list cites papers; it does not publish them',
)

assert.equal(sources.includes('## 1. Jurafsky and Martin'), true)
assert.equal(sources.includes('## 6. Baayen'), true)
assert.equal(sources.includes('notes.md'), true)
assert.equal(
  sources.includes('style card'),
  false,
  'negative: the reading list is for gras_to_text',
)

const notes = fs.readFileSync(path.join(dir, 'notes.md'), 'utf8')
assert.equal(notes.includes('| Tokenizer |'), true)
assert.equal(notes.includes('| Semantic, functional |'), true)
assert.equal(notes.includes('| 0 |'), true)
assert.equal(notes.includes('| 1 |'), true)
assert.equal(
  notes.includes('style card'),
  false,
  'negative: the notes are for gras_to_text',
)

console.log('gras_to_text research: ok')
