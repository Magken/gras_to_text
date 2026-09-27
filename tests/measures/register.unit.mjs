/**
 * Register: long words and marked words, read from every word of the text.
 * Run: npx tsx projects/gras_to_text/tests/measures/register.unit.mjs
 */
import assert from 'node:assert/strict'
import { registerGuide, registerOf, syllables } from '../../ts/src/measures/register.ts'
import { profile, reportMisses, score } from '../../ts/src/index.ts'

assert.equal(syllables('cat'), 1)
assert.equal(syllables('stone'), 1, 'a silent final e is not a syllable')
assert.equal(syllables('ordinary'), 4)
assert.equal(syllables('philosophical'), 5)
assert.equal(syllables('answered'), 2, 'negative: a silent -ed does not make a long word')
assert.equal(syllables('wanted'), 2, 'the -ed after t is spoken')

const tokens = 'The philosophical argument, whom she thus answered, was ordinary and philosophical .'.split(/\s+|(?=,)/)
const register = registerOf(tokens, new Set(['argument']))
assert.deepEqual(register.longWords.slice(0, 2), ['philosophical', 'ordinary'])
assert.equal(register.longWords.includes('argument'), false, 'negative: a subject word is not offered as a register example')
assert.deepEqual(register.marked.map((item) => item.word).sort(), ['thus', 'whom'], 'marked words come from every word, not the filler list')
const guide = registerGuide(register)
assert.match(guide, /thus and whom are older, formal words; the source uses them, so keep them, about as often as the source does\./)
assert.match(guide, /has three syllables or more, such as philosophical, ordinary/)
assert.equal(registerGuide(registerOf(['The', 'cat', 'sat', '.'])), '', 'negative: a plain text gets no register line')

const offline = { tag: false }
const source = 'She answered whom she thus trusted. The philosophical question was ordinary. She thus replied to whom it mattered, and the argument was philosophical.'
const card = await profile(source, offline)
assert.match(card.guide.find((step) => step.level === 'word').text, /thus and whom are older, formal words/)
const plain = reportMisses(await score('She said yes. The talk was dull. She said it and it was dull.', card, offline))
assert.match(plain, /used plainer words/)
assert.match(plain, /has three syllables or more; in the reply, no word\. Use some longer, formal words where the source would, and no more than that\./)
assert.match(plain, /dropped words that mark the source's register: thus, an older, formal word; whom, an older, formal word/)
const chatty = reportMisses(await score(`${source} Yeah, okay.`, card, offline))
assert.match(chatty, /The reply uses words the source never does: okay, an informal word; yeah, an informal word\. Drop them\./)
const same = reportMisses(await score(source, card, offline), { mode: 'regenerate' })
assert.doesNotMatch(same, /register|three syllables/, 'negative: the same text is not told to change its words')

console.log('register: ok')
