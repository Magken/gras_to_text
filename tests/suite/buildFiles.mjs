/**
 * Rebuild passage.pdf and passage.docx from passage.txt.
 * Run from anywhere: npx tsx projects/gras_to_text/tests/suite/buildFiles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const passage = readFileSync(path.join(dir, 'texts/passage.txt'), 'utf8').replace(/\r\n/g, '\n')

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function zip(files) {
  const parts = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const raw = Buffer.from(file.text)
    const data = deflateRawSync(raw)
    const name = Buffer.from(file.name)
    const crc = crc32(raw)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(8, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(name.length, 26)
    const chunk = Buffer.concat([local, name, data])
    parts.push(chunk)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(8, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(Buffer.concat([central, name]))
    offset += chunk.length
  }
  const centralBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, centralBuf, end])
}

function xml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildDocx(text) {
  const paragraphs = text.trim().split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
  const body = paragraphs
    .map((paragraph) => `<w:p><w:r><w:t xml:space="preserve">${xml(paragraph)}</w:t></w:r></w:p>`)
    .join('')
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
  return zip([
    { name: '[Content_Types].xml', text: types },
    { name: '_rels/.rels', text: rels },
    { name: 'word/document.xml', text: document },
    { name: 'word/_rels/document.xml.rels', text: wordRels },
  ])
}

function escapePdf(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf(text) {
  const lines = []
  for (const paragraph of text.trim().split(/\n\s*\n/)) {
    let rest = paragraph.replace(/\n/g, ' ').trim()
    while (rest.length > 90) {
      let cut = rest.lastIndexOf(' ', 90)
      if (cut < 20) cut = 90
      lines.push(rest.slice(0, cut))
      rest = rest.slice(cut).trim()
    }
    if (rest) lines.push(rest)
    lines.push('')
  }
  const commands = ['BT', '/F1 11 Tf', '14 TL', '72 760 Td']
  for (const line of lines) {
    commands.push(`(${escapePdf(line)}) Tj`)
    commands.push('T*')
  }
  commands.push('ET')
  const stream = commands.join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ]
  let body = '%PDF-1.4\n'
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body))
    body += object
  }
  const xrefAt = Buffer.byteLength(body)
  let xref = 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  return Buffer.from(`${body}${xref}trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`)
}

writeFileSync(path.join(dir, 'texts/passage.pdf'), buildPdf(passage))
writeFileSync(path.join(dir, 'texts/passage.docx'), buildDocx(passage))
console.log('passage.pdf and passage.docx written')
