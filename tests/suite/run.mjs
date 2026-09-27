/**
 * Comprehensive suite for the version 1 pipeline.
 *
 * Add a case by copying cases/_template.json to cases/<name>.json and a text
 * under texts/. The runner reads every cases/*.json except names that start
 * with _. It profiles the text, checks the whole card, and prints a line.
 *
 * Run: npm run suite   from projects/gras_to_text/ts
 * Also runs as part of npm test.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readInput } from '../../ts/src/input/readInput.ts'
import { splitSentences } from '../../ts/src/input/splitSentences.ts'
import { tagLabel } from '../../ts/src/measures/syntax.ts'
import { profile, render, reportMisses, score } from '../../ts/src/index.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const texts = path.join(root, 'texts')
const casesDir = path.join(root, 'cases')

const STARTER = ['the', 'of', 'and', 'to', 'a', 'in', 'that', 'upon', 'whilst', 'by', 'from']
const EMPTY = ['semantic', 'language']
const TAIL = ['paragraph', 'sentence', 'word']

function loadCase(file) {
  const spec = JSON.parse(readFileSync(path.join(casesDir, file), 'utf8'))
  const inputPath = path.join(texts, spec.file)
  const raw = readFileSync(inputPath)
  return { spec, inputPath, raw }
}

function inputFor(spec, inputPath, raw) {
  if (spec.file.endsWith('.pdf')) return { path: inputPath, kind: 'pdf', data: new Uint8Array(raw) }
  if (spec.file.endsWith('.docx')) return { path: inputPath, kind: 'docx', data: new Uint8Array(raw) }
  return raw.toString('utf8')
}

async function sentenceCount(spec, inputPath, raw) {
  const prepared = await readInput(inputFor(spec, inputPath, raw))
  if (prepared.sentences?.length) return { prepared, count: prepared.sentences.length }
  const paragraphs = prepared.chapters.length
    ? prepared.chapters.flatMap((chapter) => chapter.sections.flatMap((section) => section.paragraphs))
    : prepared.paragraphs
  const count = paragraphs.reduce((sum, paragraph) => sum + splitSentences(paragraph).length, 0)
  return { prepared, count, paragraphs }
}

function paragraphCount(card) {
  return card.structural.paragraphs?.length ?? 0
}

function wordLine(card) {
  return card.guide.find((step) => step.level === 'word')?.text ?? ''
}

function checkCard(card, expect) {
  for (const key of ['lexical', 'syntactic', 'structural', ...EMPTY, 'guide']) {
    assert.ok(key in card, `${key} is missing`)
  }
  for (const key of EMPTY) assert.deepEqual(card[key], {}, `${key} stays empty`)
  assert.deepEqual(Object.keys(card.structural), ['paragraphs'], 'structural holds only the paragraph sketches')
  for (const sketch of card.structural.paragraphs) {
    assert.ok(sketch.sentences > 0 && sketch.words > 0 && sketch.longest.length > 0, 'a paragraph sketch has sentences to quote')
  }
  if (expect.tagged) {
    assert.ok((card.content.words ?? []).length > 0, 'a tagged text fills the subject dictionary')
    assert.ok((card.functional.words ?? []).length > 0, 'a tagged text fills the glue-word dictionary')
    for (const entry of [...(card.content.words ?? []), ...(card.functional.words ?? [])]) {
      assert.ok(entry.uses.length > 0 && entry.uses[0].tag.length > 0, `${entry.word} has a part of speech`)
    }
  } else {
    assert.deepEqual(card.content, {}, 'negative: an untagged text does not invent a subject dictionary')
    assert.deepEqual(card.functional, {}, 'negative: an untagged text does not invent a glue-word dictionary')
  }
  assert.deepEqual(
    card.lexical.functionWords.map((word) => word.feature),
    STARTER,
    'the starter filler list is the whole list',
  )
  for (const word of card.lexical.functionWords) {
    assert.ok(word.rate >= 0 && word.rate <= 1, `${word.feature} rate is between 0 and 1`)
  }
  assert.ok(Number.isFinite(card.lexical.diversity) && card.lexical.diversity >= 0)
  const { q1, q2, q3 } = card.lexical.rhythm
  assert.ok(q1 <= q2 && q2 <= q3, 'rhythm quartiles are in order')
  if (expect.rhythmSpread) assert.ok(q3 > q1, 'sentence lengths are not all the same')

  const levels = card.guide.map((step) => step.level)
  const tail = levels.filter((level) => TAIL.includes(level))
  assert.deepEqual(tail, TAIL.filter((level) => tail.includes(level)), 'paragraph, sentence, and word stay in that order')
  for (const level of TAIL) {
    assert.ok(levels.filter((item) => item === level).length <= 1, `${level} appears once`)
  }
  const firstTail = levels.findIndex((level) => TAIL.includes(level))
  if (firstTail !== -1) {
    assert.ok(
      levels.slice(firstTail).every((level) => TAIL.includes(level)),
      'a chapter does not follow a paragraph',
    )
  }

  const kept = card.lexical.functionWords.filter((word) => word.rate > 0).map((word) => word.feature)
  const line = wordLine(card)
  const glue = line.split('These glue words')[0]
  if (kept.length === 0) assert.ok(line.startsWith('The starter filler list does not appear.'), line)
  const named = [...glue.matchAll(/\b([a-z]+)\b/g)].map((match) => match[1]).filter((word) => card.lexical.functionWords.some((item) => item.feature === word))
  for (const feature of kept) assert.ok(named.includes(feature), `the word line gives a rate for ${feature}`)
  const ranked = [...card.lexical.functionWords].filter((word) => word.rate >= 0.005).sort((a, b) => b.rate - a.rate)
  if (ranked.length > 1) assert.ok(glue.indexOf(`${ranked[0].feature} about`) < glue.indexOf(`${ranked[1].feature} about`), 'most used glue word first')
  for (const feature of expect.wordIncludes ?? []) {
    assert.ok(named.includes(feature), `word line names ${feature}`)
  }
  for (const feature of expect.wordExcludes ?? []) {
    assert.equal(named.includes(feature), false, `negative: ${feature} at rate 0 is left off the word line`)
  }

  if (expect.chapters != null) {
    assert.equal(levels.filter((level) => level === 'chapter').length, expect.chapters)
  }
  if (expect.sections != null) {
    assert.equal(levels.filter((level) => level === 'section').length, expect.sections)
  }
  if (expect.minParagraphs != null) {
    assert.ok(paragraphCount(card) >= expect.minParagraphs, `paragraphs >= ${expect.minParagraphs}`)
  }

  const prose = render(card)
  assert.ok(prose.startsWith('Write in this shape.'))
  for (const step of card.guide) {
    const label = `${step.level[0].toUpperCase()}${step.level.slice(1)}.`
    assert.ok(prose.includes(label), `the bot text names ${label}`)
  }
  if (!levels.includes('chapter')) {
    assert.equal(prose.includes('Chapter.'), false, 'negative: a text with no chapter is not given one')
  }
  if (card.syntactic.sentenceStarts.length > 0) {
    assert.ok(prose.includes('Sentences open with'))
    assert.equal(prose.includes(card.syntactic.sentenceStarts[0]), false, 'negative: the bot text does not print the raw tag alone')
  }

  if (expect.tagged) {
    assert.ok(Object.keys(card.syntactic.tagRates).length > 0, 'tags were counted')
    assert.ok(card.syntactic.sentenceStarts.length > 0)
  } else if (expect.tagged === false && expect.opensWith == null) {
    assert.deepEqual(card.syntactic.tagRates, {}, 'negative: an untagged run does not invent tags')
  }
  if (expect.opensWith) {
    const start = card.syntactic.sentenceStarts[0]
    const label = tagLabel(start)
    assert.ok(start === expect.opensWith || label === expect.opensWith, `${start} is ${expect.opensWith}`)
  }
  const sentence = card.guide.find((step) => step.level === 'sentence')?.text ?? ''
  if (expect.patternIncludes) assert.ok(sentence.includes(expect.patternIncludes), sentence)
  if (expect.pronounAbove != null) {
    const rate = Number(sentence.match(/is a pronoun \(([0-9.]+)%\)/)?.[1])
    assert.ok(rate > expect.pronounAbove, 'pronoun share is above the floor')
  }
  if (expect.passiveAbove != null) {
    const rate = Number(sentence.match(/passive[^(]*\(([0-9.]+)%\)/i)?.[1])
    assert.ok(rate > expect.passiveAbove, 'a passive was counted')
  }
  if (expect.usage) {
    assert.ok(
      line.includes('Keep these subject words') || line.includes('These glue words carry the voice'),
      'the guide says what the dictionary words are for',
    )
  }
  if (expect.phrase) {
    const blob = card.guide.map((step) => `${step.text}\n${step.excerpt ?? ''}`).join('\n')
    assert.ok(blob.includes(expect.phrase), `the profile contains ${expect.phrase}`)
  }
  return prose
}

export async function runSuite() {
  console.log('\n=== suite ===\n')

  const blank = await profile('', { tag: false })
  assert.deepEqual(blank.guide, [], 'negative: an empty text does not grow a sentence')
  await assert.rejects(
    () => profile('Hello.', { version: 2, tag: false }),
    /profile version 2 is not implemented/,
    'negative: version 2 is not version 1',
  )

  const files = readdirSync(casesDir)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort()

  for (const file of files) {
    const { spec, inputPath, raw } = loadCase(file)
    const text = inputFor(spec, inputPath, raw)
    const { count, paragraphs } = await sentenceCount(spec, inputPath, raw)
    const options = { tag: spec.tag === true }
    const card = await profile(text, options)
    checkCard(card, spec.expect ?? {})
    if (spec.expect?.minSentences != null) {
      assert.ok(count >= spec.expect.minSentences, `${spec.name} has ${count} sentences`)
    }
    if (spec.expect?.keepsSentence) {
      const sentences = (paragraphs ?? []).flatMap((paragraph) => splitSentences(paragraph))
      assert.ok(
        sentences.includes(spec.expect.keepsSentence),
        'negative: an abbreviation does not open a new sentence',
      )
    }
    if (spec.tag === true) {
      assert.equal(
        card.syntactic.sentenceStarts.length,
        count,
        'every sentence the splitter found was tagged',
      )
    }

    const hierarchy = card.guide.map((step) => step.level).join(' → ')
    const chapters = card.guide.filter((step) => step.level === 'chapter').length
    const sections = card.guide.filter((step) => step.level === 'section').length
    console.log(`--- ${spec.name} ---`)
    console.log(`hierarchy: ${hierarchy}`)
    console.log(
      `chapters ${chapters}, sections ${sections}, paragraphs ${paragraphCount(card)}, sentences ${count}, diversity ${card.lexical.diversity}, rhythm ${card.lexical.rhythm.q1} / ${card.lexical.rhythm.q2} / ${card.lexical.rhythm.q3}`,
    )
    if (card.syntactic.sentenceStarts.length > 0) {
      console.log(`opens with ${card.syntactic.sentenceStarts.join(', ')}`)
      console.log(card.guide.find((step) => step.level === 'sentence').text)
    }
    console.log(wordLine(card))

    if (spec.scoreSame && typeof text === 'string') {
      const same = reportMisses(await score(text, card, options), { mode: 'regenerate' })
      assert.ok(same.includes('The measured shape matches.'), 'negative: the same text is not a miss')
      console.log('same text: matches')
    }
    if (spec.scoreAgainst) {
      const other = readFileSync(path.join(texts, spec.scoreAgainst), 'utf8')
      const misses = await score(other, card, options)
      const report = reportMisses(misses, { mode: 'regenerate' })
      assert.ok(report.includes('Sentence.'), 'a shorter rewrite moves the sentence lengths')
      assert.doesNotMatch(report, /copies phrases/, 'negative: a rewrite of the source may reuse its words')
      if (spec.expect?.shorter) {
        const q2 = misses.find((miss) => miss.feature === 'rhythm.q2')
        assert.ok(q2.actual < q2.target, 'the rewrite is shorter at the median')
      }
      console.log(report.split('\n').slice(0, 6).join('\n'))
    }
    if (spec.background && typeof text === 'string') {
      const background = { the: { mean: 0.05, spread: 0.01 }, upon: { mean: 0, spread: 1 } }
      const marked = await profile(text, { ...options, background })
      const z = marked.lexical.functionWords.find((word) => word.feature === 'the').z
      assert.equal(typeof z, 'number', 'a background puts a z-score on the')
      const compared = await score(text, marked, { ...options, background })
      assert.equal(typeof compared.find((miss) => miss.feature === 'burrowsDelta').actual, 'number')
      const cosine = compared.find((miss) => miss.feature === 'cosine').actual
      assert.ok(Math.abs(cosine - 1) < 1e-9, 'cosine of a text against itself is 1')
      console.log(`background z(the)=${z}`)
    }
    console.log('')
  }

  console.log('suite: ok')
}
