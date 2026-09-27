/**
 * Sentence builds and punctuation per sentence, and the guide sentence that says what they mean.
 * Run: npx tsx projects/gras_to_text/tests/measures/joins.unit.mjs
 */
import assert from 'node:assert/strict'
import { joinRates, joinsGuide, punctuationRates } from '../../ts/src/measures/joins.ts'
import { profile, reportMisses, score } from '../../ts/src/index.ts'

const s = (text, tags) => ({ text, tags })
const joinedSentence = s('The pots were darker, and a few showed marks.', ['DT', 'NNS', 'VBD', 'JJR', ',', 'CC', 'DT', 'JJ', 'VBD', 'NNS', '.'])
const hung = s('She kept it because it mattered.', ['PRP', 'VBD', 'PRP', 'IN', 'PRP', 'VBD', '.'])
const plain = s('Bricks ticked.', ['NNS', 'VBD', '.'])
const bare = s('Not the rope.', ['RB', 'DT', 'NN', '.'])

const rates = joinRates([joinedSentence, hung, plain, bare])
assert.deepEqual(rates, { simple: 0.25, compound: 0.25, complex: 0.25, fragment: 0.25 })
assert.equal(joinRates([s('Untagged.', [])]), null, 'negative: untagged sentences have no build mix')

const marks = punctuationRates(['One, two, three.', 'A; b: c — d.', 'He said "go".', 'Plain.'])
assert.equal(marks.comma, 0.5)
assert.equal(marks.semicolon, 0.25)
assert.equal(marks.colon, 0.25)
assert.equal(marks.dash, 0.25)
assert.equal(marks.quote, 0.25)

assert.equal(marks.withComma, 0.25, 'the share of sentences that carry a comma')
assert.equal(marks.beforeJoin, 0, 'negative: list commas are not join commas')
const joinCommas = punctuationRates(['It rained, and we left.', 'We left, because it rained.', 'Yes, sir.', 'Plain.'])
assert.equal(joinCommas.withComma, 0.75)
assert.equal(joinCommas.beforeJoin, 2 / 3, 'a comma before and or because is a join comma')
assert.match(joinsGuide(undefined, joinCommas), /Commas: about 0\.8 per sentence, in about 8 in 10 sentences; most come before and, but, or a clause hung on because or who\./)
assert.match(joinsGuide(undefined, marks), /Commas: about 0\.5 per sentence, in about 3 in 10 sentences; most set off a phrase, a name, or a list\./)
assert.doesNotMatch(joinsGuide(undefined, punctuationRates(['Plain.', 'Also plain.'])), /most (come|set)/, 'negative: no commas, nothing to place')

const guide = joinsGuide(rates, punctuationRates(['One, two.', 'Three.']))
assert.match(guide, /How sentences are built: about 3 in 10 are one clause/)
assert.match(guide, /Do not cut a joined sentence/)
assert.match(guide, /There are no semicolons or colons or dashes\. Do not add them\./)
assert.doesNotMatch(joinsGuide(undefined, punctuationRates(['A.'])), /How sentences are built/, 'negative: no build line without tags')

const source = { paragraphs: [{ text: `${joinedSentence.text} ${hung.text}`, sentences: [joinedSentence, hung] }] }
const flat = {
  paragraphs: [{
    text: 'The pots were darker. A few showed marks.',
    sentences: [s('The pots were darker.', ['DT', 'NNS', 'VBD', 'JJR', '.']), s('A few showed marks.', ['DT', 'JJ', 'VBD', 'NNS', '.'])],
  }],
}
const card = await profile(source, { tag: false })
assert.equal(card.syntactic.joins.compound + card.syntactic.joins.complex, 1)
const misses = await score(flat, card, { tag: false })
const miss = misses.find((item) => item.feature === 'joins.joined')
assert.equal(miss.target, 1)
assert.equal(miss.actual, 0, 'the flat rewrite joins nothing')
assert.match(guide, /About 5 in 10 have two clauses: about 3 in 10 joined with and/)
const sheet = card.guide.find((step) => step.level === 'sentence').text
const repair = reportMisses(misses)
assert.match(sheet, /Nearly all have two clauses/, 'the sheet counts joined and hung sentences as two clauses')
assert.match(repair, /In the source, nearly all sentences have two clauses/, 'the repair uses the same count and the same words as the sheet')
assert.doesNotMatch(
  joinsGuide({ simple: 1, compound: 0, complex: 0, fragment: 0 }, undefined),
  /have two clauses/,
  'negative: a text with no two-clause sentences says nothing about them',
)
const few = joinsGuide({ simple: 0.92, compound: 0.08, complex: 0, fragment: 0 }, undefined)
assert.match(few, /About 1 in 10 have two clauses: about 1 in 10 joined with and, but, or so\./)
assert.doesNotMatch(few, /Do not join them|none with a clause/, 'negative: a share the sheet calls "about 1 in 10" is not also told to never join')
assert.match(joinsGuide({ simple: 0.98, compound: 0.02, complex: 0, fragment: 0 }, undefined), /Keep sentences to one clause\. Do not join them\./)
const same = await score(source, card, { tag: false })
assert.equal(same.find((item) => item.feature === 'joins.joined').actual, 1, 'negative: the same text keeps its joins')

console.log('joins: ok')
