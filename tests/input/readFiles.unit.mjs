/**
 * PDF and Word go through the same input function as text.
 * Run: npx tsx projects/gras_to_text/tests/input/readFiles.unit.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readInput } from '../../ts/src/input/readInput.ts'

const pdf = await readInput({
  kind: 'pdf',
  data: new Uint8Array(readFileSync(new URL('../../spec/fixtures/hello.pdf', import.meta.url))),
})
assert.equal(pdf.kind, 'pdf')
assert.equal(pdf.paragraphs.join(' ').includes('Hello from pdf'), true)
assert.equal(pdf.chapters.length, 0)

const docx = await readInput({
  kind: 'docx',
  data: new Uint8Array(readFileSync(new URL('../../spec/fixtures/hello.docx', import.meta.url))),
})
assert.equal(docx.kind, 'docx')
assert.equal(docx.paragraphs.join(' ').includes('Hello from word'), true)

await assert.rejects(
  () => readInput({ kind: 'pdf', data: new Uint8Array([1, 2, 3]) }),
  /not a PDF/,
  'negative: bytes that are not a PDF do not become a paragraph',
)

console.log('readFiles: ok')
