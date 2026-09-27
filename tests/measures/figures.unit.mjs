/**
 * Three habits of a voice: clause chaining, the second reading, and short maxims.
 * Run: npx tsx projects/gras_to_text/tests/measures/figures.unit.mjs
 */
import assert from 'node:assert/strict'
import { chains, figureRates, isMaxim, rereads } from '../../ts/src/measures/figures.ts'

const thursday = 'He said a blank looked like carelessness to a buyer, and a buyer was coming on Thursday, and Thursday was not a philosophical day.'
assert.equal(chains(thursday), true, 'a clause that picks up the last word of the clause before')
assert.equal(chains('The kiln cooled in the night, and the yard was quiet.'), false, 'negative: two clauses with no word picked up')
assert.equal(chains('The hill was not steep.'), false, 'negative: a word picked up from the sentence before is ordinary cohesion')

assert.equal(rereads('The not speaking was a kindness, or it was fatigue, and she decided she did not need to know which.'), true)
assert.equal(rereads('She asked for tea or coffee.'), false, 'negative: a plain choice is not a second reading')
assert.equal(rereads('He would come, or else send word.'), true)

assert.equal(isMaxim('A plain order can be kept.'), true)
assert.equal(isMaxim('A boy carried shelves to the wall.'), false, 'negative: a past event is not a maxim')
assert.equal(isMaxim('“Nothing is certain.”'), false, 'negative: speech is not the narrator\'s maxim')
assert.equal(isMaxim('A plain order can be kept by anyone who writes it down in the book before the bell.'), false, 'negative: a long sentence is not a maxim')
assert.equal(isMaxim('Nothing is ever as he says.'), false, 'negative: a named person makes it particular')

const rates = figureRates([thursday, 'A plain order can be kept.', 'The yard was quiet.', 'The bell rang.'])
assert.equal(rates.chain, 0.25)
assert.equal(rates.maxim, 0.25)
assert.equal(rates.reread, 0)
assert.equal(rates.examples.chain, thursday, 'the first source sentence for each habit is kept')
assert.equal(rates.examples.reread, undefined, 'negative: no habit, no example')

const insideSpeech = figureRates(['“You must see it plain.', 'A fortnight is very little.', 'Nothing more can be said.”', 'She left.'])
assert.equal(insideSpeech.maxim, 0, 'negative: a general truth inside a character\'s speech is not the narrator\'s maxim')

console.log('figures: ok')
