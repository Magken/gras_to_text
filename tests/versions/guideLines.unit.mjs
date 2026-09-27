/**
 * The sheet lines a writer misread in the blind batch: glue rates without a reference,
 * pronoun rates without a reference, and long sentences with no length to reach.
 * Run: npx tsx projects/gras_to_text/tests/versions/guideLines.unit.mjs
 */
import assert from 'node:assert/strict'
import { figuresLine, glueLine, lengthLine, pronounLine } from '../../ts/src/versions/v1.ts'

const words = (rates) => Object.entries(rates).map(([feature, rate]) => ({ feature, rate }))

const sparse = glueLine(words({ the: 0.031, of: 0.029, and: 0.022 }))
assert.match(sparse, /the source uses under half the "the" \(7\); about as much "of" \(4\), "and" \(3\)\. Hold to the source's rates, not the ordinary ones\./, 'a rate far below ordinary prose is named against it, and the heavy glue words that stay ordinary are named too')
assert.doesNotMatch(glueLine(words({ the: 0.031, of: 0.029, by: 0.012 })), /about as much "by"/, 'negative: a light glue word near ordinary is not named')
const heavy = glueLine(words({ the: 0.117, and: 0.049, of: 0.02 }))
assert.match(heavy, /more "the" \(7\), "and" \(3\); less "of" \(4\)/, 'rates above and below ordinary prose are grouped')
const plain = glueLine(words({ the: 0.07, of: 0.035, and: 0.03 }))
assert.doesNotMatch(plain, /ordinary English prose/, 'negative: ordinary rates get no comparison')

const fewer = pronounLine({ pronoun: 0.085, passive: 0 })
assert.match(fewer, /fewer than most stories use \(about 1 in 9\)\. About 1 in 4 times you would write he, she, or it, name the person or thing instead; keep the rest as pronouns\./, 'the rename is a share, sized by the gap to ordinary prose')
assert.doesNotMatch(fewer, /use a pronoun only right after the name/, 'negative: no blanket rule, which drove blind writers to half the source rate')
assert.match(pronounLine({ pronoun: 0.055, passive: 0 }), /About 1 in 2 times you would write/, 'a wider gap renames more')
assert.match(pronounLine({ pronoun: 0.135, passive: 0 }), /more than most stories use \(about 1 in 9\)\. Let people speak as I and you/)
const usual = pronounLine({ pronoun: 0.11, passive: 0 })
assert.doesNotMatch(usual, /most stories/, 'negative: an ordinary pronoun share gets no comparison')
assert.match(usual, /Use a pronoun when the person was just named/)
assert.match(pronounLine({ pronoun: 0, passive: 0 }), /There are no pronouns/)

const lengths = [3, 4, 5, 6, 8, 9, 10, 10, 11, 12, 14, 19, 20, 22, 24, 30]
const line = lengthLine({ q1: 6, q2: 10, q3: 19, afterLong: 0 }, lengths)
assert.match(line, /In every 8 sentences, about 2 run 19 words or more, and the longest reach about 24\./, 'the long sentences get a length to reach')
assert.doesNotMatch(lengthLine({ q1: 5, q2: 5, q3: 5, afterLong: 0 }, [5, 5, 5, 5]), /longest reach/, 'negative: even lengths have no long tail to name')

const talky = lengthLine({ q1: 7, q2: 13, q3: 21, afterLong: 0.25, spoken: 14 }, lengths)
assert.match(talky, /Speech runs as long as the narration: a typical spoken sentence is about 14 words\. Let people talk in full sentences, not short lines\./, 'long speech is named, so dialogue is not cut into short lines')
const clipped = lengthLine({ q1: 7, q2: 13, q3: 21, afterLong: 0.25, spoken: 6 }, lengths)
assert.match(clipped, /Speech is shorter than the narration: a typical spoken sentence is about 6 words\./)
assert.doesNotMatch(line, /Speech/, 'negative: no speech measured, no speech line')

const habits = figuresLine({ chain: 0.023, reread: 0.012, maxim: 0, examples: { chain: 'A buyer, and a buyer was coming.', reread: 'A kindness, or it was fatigue.' } })
assert.match(habits, /Now and then a clause picks up the last word of the clause before, about 2 times in 100 sentences: "A buyer, and a buyer was coming\."/)
assert.match(habits, /Now and then a statement is followed by a second reading of it, about once in 100 sentences: "A kindness, or it was fatigue\."/)
assert.doesNotMatch(habits, /general truth/, 'negative: a habit the source never shows is not asked for')
assert.equal(figuresLine({ chain: 0, reread: 0, maxim: 0, examples: {} }), '', 'negative: no habits, no line')

console.log('guideLines: ok')
