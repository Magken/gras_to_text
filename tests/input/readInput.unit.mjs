/**
 * Text, JSON, and Markdown share one input function. A raw paste does not become a chapter.
 * Run: npx tsx projects/gras_to_text/tests/input/readInput.unit.mjs
 */
import assert from 'node:assert/strict'
import { readInput } from '../../ts/src/input/readInput.ts'

const plain = await readInput('Chapter 1\n\nHello there.')
assert.equal(plain.kind, 'text')
assert.deepEqual(plain.paragraphs, ['Chapter 1', 'Hello there.'])
assert.equal(plain.chapters.length, 0, 'negative: plain text does not invent a chapter')

const marked = await readInput({
  paragraphs: [
    {
      text: 'The cat sat.',
      sentences: [{ text: 'The cat sat.', tags: ['DT', 'NN', 'VBD'] }],
    },
  ],
})
assert.equal(marked.kind, 'json')
assert.deepEqual(marked.sentences, [{ text: 'The cat sat.', tags: ['DT', 'NN', 'VBD'] }])

const markdown = await readInput('# One\n\n## A\n\nHello there.')
assert.equal(markdown.kind, 'markdown')
assert.equal(markdown.chapters[0].title, 'One')
assert.equal(markdown.chapters[0].sections[0].title, 'A')
assert.deepEqual(markdown.chapters[0].sections[0].paragraphs, ['Hello there.'])

await assert.rejects(
  () => readInput({ path: 'notes.exe' }),
  /no reader/,
  'negative: an unknown file type is refused',
)

console.log('readInput: ok')
