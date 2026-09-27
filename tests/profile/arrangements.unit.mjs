/**
 * Sentence shapes: how a sentence opens, how it is built, and a real example.
 * Run: npx tsx projects/gras_to_text/tests/profile/arrangements.unit.mjs
 */
import assert from 'node:assert/strict'
import { arrangementGuide, observeArrangements, shownShapes, unquoted } from '../../ts/src/profile/arrangements.ts'

assert.equal(unquoted('“I desire you will do no such thing.'), 'I desire you will do no such thing.', 'the unpaired opening mark goes')
assert.equal(unquoted('What a fine thing for our girls!”'), 'What a fine thing for our girls!', 'the unpaired closing mark goes')
assert.equal(unquoted('“You want to tell me.”'), '“You want to tell me.”', 'negative: paired marks stay')
assert.equal(unquoted('He said "no" twice.'), 'He said "no" twice.', 'negative: paired straight quotes stay')
import { sentenceBuild } from '../../ts/src/measures/joins.ts'
import { dictionaryFromJson, dictionaryToJson } from '../../ts/src/profile/dictionary.ts'
import { profile, recommend, reportMisses, score } from '../../ts/src/index.ts'

const s = (text, tags) => ({ text, tags })

const compound = s('The pots were darker, and a few showed marks.', ['DT', 'NNS', 'VBD', 'JJR', ',', 'CC', 'DT', 'JJ', 'VBD', 'NNS', '.'])
const simple = s('Bricks ticked.', ['NNS', 'VBD', '.'])
const complex = s('She kept it because it mattered.', ['PRP', 'VBD', 'PRP', 'IN', 'PRP', 'VBD', '.'])
const fragment = s('Not the rope.', ['RB', 'DT', 'NN', '.'])
const sharedSubject = s('The boy carried shelves and set them down.', ['DT', 'NN', 'VBD', 'NNS', 'CC', 'VBD', 'PRP', 'RP', '.'])

assert.equal(sentenceBuild(compound).type, 'compound', 'two clauses joined with ", and"')
assert.equal(sentenceBuild(simple).type, 'simple')
assert.equal(sentenceBuild(complex).type, 'complex', 'a clause hung on because')
assert.equal(sentenceBuild(fragment).type, 'fragment', 'no main verb')
assert.equal(sentenceBuild(sharedSubject).type, 'simple', 'negative: one subject with two verbs is not two clauses')
assert.equal(sentenceBuild(s('Untagged.', [])), null, 'negative: no tags, no build')

const kiln = s('The kiln stood in the yard.', ['DT', 'NN', 'VBD', 'IN', 'DT', 'NN', '.'])
const cooled = s('The kiln cooled in the dark.', ['DT', 'NN', 'VBD', 'IN', 'DT', 'NN', '.'])
const letter = s('She wrote the letter to the buyer.', ['PRP', 'VBD', 'DT', 'NN', 'TO', 'DT', 'NN', '.'])

const chains = observeArrangements([[kiln, cooled], [letter]])
const named = chains.find((item) => item.chain === 'determiner then noun then verb')
assert.ok(named, 'the opening is a chain, not a tag percentage')
assert.equal(named.type, 'simple')
assert.equal(named.count, 2)
assert.equal(named.example, kiln.text, 'the example is a real source sentence')
assert.deepEqual(named.paragraphs, [1])
assert.ok(named.topics.includes('kiln'), 'a shape in one paragraph of three keeps its topic')
assert.match(named.meaning, /Open by naming the thing, then say what it did\. Keep it to one clause\./)
const stayed = chains.find((item) => item.chain === 'pronoun then verb then determiner')
assert.ok(stayed)
assert.equal(stayed.example, letter.text)

const spread = observeArrangements([[kiln], [cooled], [s('The bell rang in the street.', ['DT', 'NN', 'VBD', 'IN', 'DT', 'NN', '.'])]])
assert.deepEqual(spread[0].paragraphs, [1, 2, 3])
assert.deepEqual(spread[0].topics, [], 'negative: a shape in every paragraph gets no topic label')

const pell = {
  text: 'Mr. Pell wanted the third column filled.',
  tags: ['PROPN', 'PROPN', 'PROPN', 'VERB', 'DET', 'ADJ', 'NOUN', 'VERB', 'PUNCT'],
  words: ['mr', '.', 'pell', 'wanted', 'the', 'third', 'column', 'filled', '.'],
}
const person = observeArrangements([[pell]])[0]
assert.equal(person.chain, 'name then verb then determiner', 'a title and name fill one slot, even when the tagger tags the dot')
assert.match(person.meaning, /^Open on a person by name, then say what they did\./)
assert.equal(named.chain.startsWith('name'), false, 'negative: "The kiln" is not a name')

const toThing = observeArrangements([[s('I see no occasion for that.', ['PRP', 'VBP', 'DT', 'NN', 'IN', 'DT', '.'])]])[0]
const toPerson = observeArrangements([[s('I desire you will do no such thing.', ['PRP', 'VBP', 'PRP', 'MD', 'VB', 'DT', 'JJ', 'NN', '.'])]])[0]
assert.match(toThing.meaning, /The next word is the, a, or this\./, 'the third slot tells two pronoun-then-verb shapes apart')
assert.match(toPerson.meaning, /The next word is a pronoun, such as you, him, or it\./)
assert.notEqual(toThing.meaning, toPerson.meaning, 'negative: two shapes never share one line of wording')
assert.doesNotMatch(named.meaning, /The next word/, 'negative: a three-slot gloss gets no extra slot line')

const many = (chain, tags, count) => ({ chain, tags, type: 'simple', count, meaning: chain, example: `${chain}.`, topics: [], paragraphs: [1] })
const ranked = [
  many('a', ['DT'], 30), many('b', ['DT'], 20), many('c', ['DT'], 15), many('d', ['DT'], 10),
  many('e', ['DT'], 8), many('f', ['DT'], 6), many('g', ['DT'], 6), many('h', ['DT'], 5),
]
assert.deepEqual(shownShapes(ranked).map((item) => item.chain), ['a', 'b', 'c', 'd', 'e', 'f'], 'up to six shapes of 1 in 20 or more')
assert.deepEqual(shownShapes([many('a', ['DT'], 97), many('b', ['DT'], 3)]).map((item) => item.chain), ['a'], 'negative: a shape under 1 in 20 is not shown')

const guide = arrangementGuide(chains)
assert.match(guide, /Vary the sentence shapes/)
assert.match(guide, /Example: "The kiln stood in the yard\."/)
assert.match(guide, /- Open by naming the thing, then say what it did\. Keep it to one clause\. About \d+ in 10 sentences\./)
assert.doesNotMatch(guide, /\(\d+\)/, 'negative: no raw counts in the bot text')
assert.doesNotMatch(guide, / then noun| then verb then /, 'negative: tag chains stay in the profile, not the bot text')

const added = observeArrangements([[s('The kiln stood.', ['DT', 'NN', 'VBD', '.'])]], chains)
assert.equal(added.find((item) => item.chain === 'determiner then noun then verb').count, 3)
assert.equal(chains.find((item) => item.chain === 'determiner then noun then verb').count, 2, 'negative: adding does not change the stored list')

const back = dictionaryFromJson(dictionaryToJson({ words: [], arrangements: chains }))
assert.equal(back.arrangements.find((item) => item.chain === 'determiner then noun then verb').example, kiln.text)

const source = {
  paragraphs: [
    { text: `${kiln.text} ${cooled.text}`, sentences: [kiln, cooled] },
    { text: letter.text, sentences: [letter] },
  ],
}
const reply = {
  paragraphs: [
    { text: 'She wrote. She wrote.', sentences: [s('She wrote.', ['PRP', 'VBD', '.']), s('She wrote.', ['PRP', 'VBD', '.'])] },
  ],
}
const card = await profile(source, { tag: false })
assert.match(recommend(card), /Example: "The kiln stood in the yard\."/)
const note = reportMisses(await score(reply, card, { tag: false }))
assert.match(note, /Put that shape back, like this: "The kiln stood in the yard\."/)
assert.doesNotMatch(note, /The measured shape matches/)
assert.doesNotMatch(note, /determiner then/, 'negative: the repair names the shape by what it does, not by its tags')

const rareShape = Array.from({ length: 40 }, () => kiln)
const hidden = { paragraphs: [{ text: 'x', sentences: [...rareShape, letter] }, { text: 'y', sentences: [letter] }] }
const hiddenCard = await profile(hidden, { tag: false })
assert.equal(shownShapes(hiddenCard.syntactic.arrangements).some((item) => item.chain.startsWith('pronoun')), false)
const hiddenMisses = await score({ paragraphs: [{ text: 'z', sentences: [kiln, kiln] }] }, hiddenCard, { tag: false })
assert.equal(hiddenMisses.some((miss) => miss.feature.includes('pronoun then verb')), false, 'negative: the score does not ask for a shape the sheet never showed')

console.log('arrangements: ok')
