/**
 * Score is the signed gap between a source profile and a new text.
 * reportMisses turns it into a ranked repair list, paragraph by paragraph when the breaks line up.
 * Run: npx tsx projects/gras_to_text/tests/profile/score.unit.mjs
 */
import assert from 'node:assert/strict'
import { profile, recommend, reportMisses, score } from '../../ts/src/index.ts'
import { REPAIR_LIMIT } from '../../ts/src/profile/recommend.ts'

const offline = { tag: false }
const source = 'The cat sat upon the mat and the rain did not stop.'
const card = await profile(source, offline)
const same = await score(source, card, offline)
const report = reportMisses(same, { mode: 'regenerate' })
assert.match(reportMisses(same), /copies phrases from the source's examples/, 'a new text that repeats the source is told it copied')
assert.equal(same.find((miss) => miss.feature === 'copied').actual > 0, true)
assert.ok(Math.abs(same.find((miss) => miss.feature === 'cosine').actual - 1) < 1e-9)
assert.equal(report.includes('The measured shape matches.'), true)
assert.equal(report.includes('Put them back'), false, 'negative: an unchanged reply is not told to move a word')
assert.equal(report.includes('The reply moved'), false, 'negative: an unchanged reply is not told it moved')

const flat = await score('Cat sat. Rain stopped.', card, offline)
const gaps = reportMisses(flat)
assert.equal(gaps.includes('Sentence.'), true)
assert.ok(flat.find((miss) => miss.feature === 'the').actual < flat.find((miss) => miss.feature === 'the').target)
assert.match(gaps.split('\n')[0], /^The reply moved: it cut the sentences short/, 'the lead says what happened')
assert.doesNotMatch(gaps, /Cosine|Burrows|filler-word gap/, 'negative: summary statistics stay in the misses')

const long = [
  'The kiln at the north end of the yard kept its heat through the night, and the bricks ticked as they cooled.',
  'The crane by the gate turned once and stopped because it had nothing to lift that morning.',
].join('\n\n')
const short = ['The kiln kept its heat. The bricks ticked. They cooled.', 'The crane turned. It stopped. It had nothing to lift.'].join('\n\n')
const pair = await profile(long, offline)
const shortMisses = await score(short, pair, offline)
assert.doesNotMatch(reportMisses(shortMisses), /Paragraph 1\.|paragraphs? and the reply has/, 'negative: a new text is not held to the source layout')
const repair = reportMisses(shortMisses, { mode: 'regenerate' })
assert.match(repair, /Paragraph 1\. The reply says it in 3 sentences of about \d+ words: "The kiln kept its heat\. The bricks ticked\."/)
assert.match(repair, /such as "The kiln at the north end/)
assert.match(repair, /Keep: .*2 paragraphs/, 'what already matches is named')
const numbered = repair.split('\n').filter((line) => /^\d+\. /.test(line))
assert.ok(numbered.length > 0 && numbered.length <= REPAIR_LIMIT, 'at most the repair limit')

const broken = reportMisses(await score('The kiln kept its heat and the bricks ticked as they cooled.', pair, offline), { mode: 'regenerate' })
assert.match(broken, /The source has 2 paragraphs and the reply has 1/)
assert.doesNotMatch(broken, /Paragraph 1\. The reply says/, 'negative: paragraphs are not paired when the breaks differ')

const over = reportMisses([{ feature: 'the', target: 0.12, actual: 0.16 }])
assert.match(over, /the was about 12 in 100 words and is about 16 in 100 words; aim for 10 to 14\. Use it less, down to that rate and no lower\./)
const near = reportMisses([{ feature: 'the', target: 0.12, actual: 0.13 }])
assert.doesNotMatch(near, /aim for/, 'negative: a rate inside the band is not a repair')
assert.match(near, /Keep: the rate of the/)
const lengths = reportMisses([
  { feature: 'rhythm.q1', target: 6, actual: 3 },
  { feature: 'rhythm.q2', target: 10, actual: 4 },
  { feature: 'rhythm.q3', target: 19, actual: 5 },
])
assert.match(lengths, /Bring the typical sentence back to 9 to 11 words, and let about a quarter run 19 or more\. Stop there; do not push past it\./)
const joinsGap = reportMisses([{ feature: 'joins.joined', target: 0.4, actual: 0 }])
assert.match(joinsGap, /until 3 to 5 in 10 sentences have two clauses, and no more\./)
const quartiles = [
  { feature: 'rhythm.q1', target: 6, actual: 6 },
  { feature: 'rhythm.q2', target: 10, actual: 10 },
  { feature: 'rhythm.q3', target: 19, actual: 19 },
]
const noContrast = reportMisses([...quartiles, { feature: 'rhythm.afterLong', target: 0.35, actual: 0.13 }])
assert.match(noContrast, /about 4 in 10 long sentences \(19 words or more\) are followed at once by a short one \(6 or fewer\); in the reply, about 1 in 10\. Move short sentences from between middling ones to right after a long one, until 3 to 5 in 10 long sentences have one\. Do not add short sentences; move them\./)
const close = reportMisses([...quartiles, { feature: 'rhythm.afterLong', target: 0.35, actual: 0.3 }])
assert.doesNotMatch(close, /followed at once/, 'negative: a small gap after long sentences is not a repair')
assert.match(close, /what follows a long sentence/)
const austenish = await profile('It is a truth universally acknowledged, that a single man must be in want of a wife. However little known the feelings may be, the truth is well fixed.', offline)
const echo = await score('It is a custom long kept on the river, that no ferry shall cross. The ice came early.', austenish, offline)
const echoMiss = echo.find((miss) => miss.feature === 'echoed')
assert.equal(echoMiss?.actual, 1, 'the score flags an opening that echoes the source\'s first words')
assert.match(reportMisses(echo), /Sentence\. The reply opens the way the source does: "It is a custom long kept on the river, that no ferry shall cross\." Open on your own subject, in your own words\./)
assert.doesNotMatch(reportMisses(echo, { mode: 'regenerate' }), /opens the way the source does/, 'negative: a rewrite may keep the opening')
assert.equal((await score('The ice came early that year.', austenish, offline)).find((miss) => miss.feature === 'echoed')?.actual, 0, 'negative: an opening of its own is not flagged')
assert.match(recommend(austenish), /Do not open on the first words of the first example\./)
assert.doesNotMatch(recommend(austenish, { mode: 'regenerate' }), /Do not open on the first words/, 'negative: a rewrite keeps its opening')
const chainSource = await profile('A blank looked bad to a buyer, and a buyer was coming on Thursday, and Thursday was busy. The yard was quiet. The bell rang. A plain order can be kept.', offline)
assert.equal(chainSource.syntactic.figures?.chain, 0.25, 'the profile carries the habits')
const noChain = await score('The yard was quiet. The bell rang twice. The men came in. A cart stood by the gate.', chainSource, offline)
assert.equal(noChain.find((miss) => miss.feature === 'figure.chain')?.actual, 0)
assert.match(reportMisses(noChain), /Sentence\. The source lets a clause pick up the last word of the clause before, about 25 times in 100 sentences; the reply never does\. Do it once or twice, like this: "A blank looked bad to a buyer, and a buyer was coming on Thursday, and Thursday was busy\."/)
assert.doesNotMatch(reportMisses(await score('A blank looked odd to a buyer, and a buyer came on Monday, and Monday was slow. The yard was quiet. The bell rang. A plain rule can be kept.', chainSource, offline)), /pick up the last word/, 'negative: a reply with the habit is not asked for it')
assert.equal((await score('The yard was quiet.', austenish, offline)).some((miss) => miss.feature === 'figure.chain'), false, 'negative: a habit the source never shows is not scored')
const clippedSpeech = reportMisses([...quartiles, { feature: 'rhythm.spoken', target: 13, actual: 6 }])
assert.match(clippedSpeech, /clipped the speech/)
assert.match(clippedSpeech, /Speech\. A typical spoken sentence in the source is about 13 words; in the reply, about 6\. Let people say more in each sentence, until spoken sentences run 12 to 14 words\./)
assert.doesNotMatch(reportMisses([...quartiles, { feature: 'rhythm.spoken', target: 13, actual: 12 }]), /Speech\./, 'negative: a small gap in speech length is not a repair')
const talkSource = Array.from({ length: 6 }, (_, i) => `“I shall not go to the town today, whatever you may say to me about it${i}.”`).join(' ')
const talkCard = await profile(talkSource, offline)
const talkMisses = await score(Array.from({ length: 6 }, () => '“No.” He left.').join(' '), talkCard, offline)
assert.ok(talkMisses.find((miss) => miss.feature === 'rhythm.spoken'), 'a reply with speech is scored on its length')
const quiet = await score('The yard was quiet. It was cold. The men came in. They stood by the gate. Nobody spoke.', talkCard, offline)
assert.equal(quiet.find((miss) => miss.feature === 'rhythm.spoken'), undefined, 'negative: a reply without speech is not asked to add it')
const longSource = [
  'The yard was quiet in the early morning, and the kilns along the north wall still held the heat of the night before.',
  'It was cold.',
  'The men came in from the lane with coats done up to the chin, and they stood by the gate for a while.',
  'Nobody spoke.',
  'The first cart of clay arrived at nine from the pit on the hill, and the driver backed it up against the shed.',
  'It rained.',
  'A boy ran.',
].join(' ')
const longCard = await profile(longSource, offline)
const choppy = await score('The yard was quiet. It was cold. The men came in. They stood by the gate. Nobody spoke. A cart came. It rained. A boy ran.', longCard, offline)
assert.equal(choppy.find((miss) => miss.feature === 'rhythm.afterLong'), undefined, 'negative: a reply with no long sentences has nothing to follow them; the length repair carries it')
const kept = await score(longSource, longCard, offline)
assert.ok(kept.find((miss) => miss.feature === 'rhythm.afterLong'), 'a reply with long sentences is scored on what follows them')

const tracedCard = await profile('The kiln at the yard kept its heat. The first column was the hour. The second was the flame.', offline)
const traced = reportMisses(await score('The oven kept its warmth. The first mark was the weight. Nobody spoke.', tracedCard, offline))
assert.match(traced, /trace one example word for word with new nouns: "The first mark was the weight\." follows "The first column was the hour\."/)
assert.doesNotMatch(reportMisses(await score('The oven kept its warmth. The first mark was the weight. Nobody spoke.', tracedCard, offline), { mode: 'regenerate' }), /trace one example/, 'negative: a rewrite may keep the frames')

const background = { the: { mean: 0, spread: 1 }, upon: { mean: 0, spread: 1 } }
const marked = await profile(source, { ...offline, background })
const compared = await score('Cat sat. Rain stopped.', marked, { ...offline, background })
assert.equal(typeof compared.find((miss) => miss.feature === 'burrowsDelta').actual, 'number')

console.log('score: ok')
