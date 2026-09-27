/**
 * A usage dictionary records each word and the tags it takes.
 * It can be stored as JSON and added onto. The guide and the difference read it.
 * Run: npx tsx projects/gras_to_text/tests/profile/dictionary.unit.mjs
 */
import assert from 'node:assert/strict'
import {
  addToDictionary,
  buildDictionary,
  dictionaryFromJson,
  dictionaryToJson,
  profile,
  reportMisses,
  score,
} from '../../ts/src/index.ts'

const kiln = {
  paragraphs: [
    {
      text: 'The kiln stood. The kiln cooled.',
      sentences: [
        { text: 'The kiln stood.', tags: ['DT', 'NN', 'VBD'] },
        { text: 'The kiln cooled.', tags: ['DT', 'NN', 'VBD'] },
      ],
    },
  ],
}

const dictionary = await buildDictionary(kiln, { tag: false })
const entry = dictionary.words.find((word) => word.word === 'kiln')
assert.equal(entry.count, 2)
assert.equal(entry.uses[0].tag, 'NN')
assert.equal(entry.uses[0].count, 2)
assert.equal(
  dictionary.words.some((word) => word.word === 'yard'),
  false,
  'negative: a word that never appears is not invented',
)

const added = await addToDictionary(
  dictionary,
  {
    paragraphs: [
      {
        text: 'The kiln cracked.',
        sentences: [{ text: 'The kiln cracked.', tags: ['DT', 'NN', 'VBD'] }],
      },
    ],
  },
  { tag: false },
)
assert.equal(added.words.find((word) => word.word === 'kiln').count, 3)
assert.equal(
  dictionary.words.find((word) => word.word === 'kiln').count,
  2,
  'negative: adding a text on does not change the dictionary already stored',
)

const round = dictionaryFromJson(dictionaryToJson(dictionary))
assert.equal(round.words.find((word) => word.word === 'kiln').uses[0].tag, 'NN')
await assert.rejects(async () => dictionaryFromJson('{"nope":1}'), /dictionary JSON needs a words list/)

const card = await profile(kiln, { tag: false })
const wordStep = card.guide.find((step) => step.level === 'word')
assert.equal(wordStep.subject.includes('kiln is a noun'), true)
assert.equal(wordStep.text.includes('kiln is a noun'), false, 'negative: subject words sit apart from the glue words')
assert.equal(card.functional.words.find((item) => item.word === 'the').uses[0].tag, 'DT', 'the glue role stays in the profile')
assert.equal(wordStep.text.includes('is used as'), false, 'negative: glue roles stay out of the bot text')

const hale = {
  paragraphs: [
    {
      text: 'Dr. Hale still had the kiln. Dr. Hale still had the blank book.',
      sentences: [
        {
          text: 'Dr. Hale still had the kiln.',
          tags: ['PROPN', 'PUNCT', 'PROPN', 'ADV', 'VERB', 'DET', 'NOUN', 'PUNCT'],
          words: ['dr', '.', 'hale', 'still', 'had', 'the', 'kiln', '.'],
        },
        {
          text: 'Dr. Hale still had the blank book.',
          tags: ['NNP', '.', 'NNP', 'RB', 'VBD', 'DT', 'JJ', 'NN', '.'],
        },
      ],
    },
  ],
}
const haleCard = await profile(hale, { tag: false })
assert.deepEqual(haleCard.content.names, [{ name: 'Dr. Hale', count: 2 }], 'a name keeps its case and its title')
const haleSubject = haleCard.guide.find((step) => step.level === 'word').subject
assert.match(haleSubject, /kiln is a noun/)
assert.match(haleSubject, /Keep these names as written: Dr\. Hale\./)
assert.doesNotMatch(haleSubject, /still is/, 'negative: an adverb is not a subject word')
assert.doesNotMatch(haleSubject, /had is/, 'negative: a verb is not a subject word')
assert.doesNotMatch(haleSubject, /hale is/, 'negative: a name is not a lowercase subject word')
const nameMisses = await score('The kiln stood. The blank book waited.', haleCard, { tag: false })
assert.match(reportMisses(nameMisses, { mode: 'regenerate' }), /It also dropped these names: Dr\. Hale\. Keep names as written\./)
const newTextReport = reportMisses(nameMisses)
assert.doesNotMatch(newTextReport, /dropped these names|Keep names/, 'negative: a new text is not told to put the source names back')
const quoting = reportMisses([{ feature: 'figure.maxim', target: 0.01, actual: 0, note: 'A plain order can be kept.' }])
assert.match(quoting, /The quoted source sentences show how to build a sentence, not what to say\./, 'a quoted source sentence is marked as a model of the build')
assert.doesNotMatch(newTextReport, /1 paragraphs|let a few reach 7\./, 'negative: no "1 paragraphs", and no longer target that equals the typical one')
assert.doesNotMatch(
  reportMisses(nameMisses, { mode: 'regenerate' }),
  /not what to say/,
  'negative: a rewrite keeps what the source says, so it gets no such warning',
)
const stored = dictionaryFromJson(dictionaryToJson(await buildDictionary(hale, { tag: false })))
assert.deepEqual(stored.names, [{ name: 'Dr. Hale', count: 2 }])
assert.equal(card.content.words.find((item) => item.word === 'kiln').uses[0].tag, 'NN')
assert.deepEqual(card.semantic, {})
assert.deepEqual(card.language, {})

const potMisses = await score('The pot stood. The pot cooled.', card, { tag: false })
const report = reportMisses(potMisses, { mode: 'regenerate' })
assert.equal(report.includes('kiln is a noun'), true)
assert.equal(report.includes('Keep them when the subject stays.'), true)
assert.equal(reportMisses(potMisses).includes('kiln'), false, 'negative: a new text on another subject is not told to use kiln')
assert.equal(
  reportMisses(await score('The kiln stood. The kiln cooled.', card, { tag: false }), { mode: 'regenerate' }).includes('kiln is a noun'),
  false,
  'negative: a reply that keeps the subject word is not told it is missing',
)

const nouns = ['ash', 'bell', 'clay', 'dust', 'flame', 'gate', 'hinge', 'kiln', 'rope', 'yard']
const many = {
  paragraphs: [{
    text: nouns.map((noun) => `The ${noun} fell. The ${noun} fell.`).join(' '),
    sentences: nouns.flatMap((noun) => [0, 1].map(() => ({ text: `The ${noun} fell.`, tags: ['DT', 'NN', 'VBD', '.'] }))),
  }],
}
const manyCard = await profile(many, { tag: false })
const sheetSubjects = manyCard.guide.find((step) => step.level === 'word').subject
const manyReport = reportMisses(await score('The ash fell. The ash fell.', manyCard, { tag: false }), { mode: 'regenerate' })
const asked = manyReport.match(/dropped these subject words: ([^.]+)\./)[1].split('; ').map((bit) => bit.split(' ')[0])
assert.equal(asked.length, 7, 'the reply kept ash, so seven of the eight shown are asked for')
for (const word of asked) assert.ok(sheetSubjects.includes(`${word} is a noun`), `${word} is asked for and shown on the sheet`)
assert.equal(sheetSubjects.includes('rope is'), false)
assert.equal(asked.includes('rope'), false, 'negative: a word the sheet never showed is not asked for in the repair')

console.log('dictionary: ok')
