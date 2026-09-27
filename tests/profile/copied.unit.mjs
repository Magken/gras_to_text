/**
 * Copied phrases: runs of four or more words a reply shares with the sentences the sheet shows.
 * Run: npx tsx projects/gras_to_text/tests/profile/copied.unit.mjs
 */
import assert from 'node:assert/strict'
import { copiedFrames, copiedPhrases, echoedOpening } from '../../ts/src/profile/copied.ts'

const shown = [
  'A boy carried shelves from the shed to the wall and set them down too hard.',
  'The kiln kept its heat through the night, and the bricks ticked as they cooled.',
  'The second was the colour of the flame.',
]
assert.deepEqual(
  copiedPhrases('Tam carried the crates out to the van and set them down too hard. The ovens ticked as they cooled.', shown),
  ['and set them down too hard', 'ticked as they cooled'],
  'lifted phrases are found and merged into their longest run',
)
assert.deepEqual(
  copiedPhrases('The second was the weight. It was the colour of the sea.', shown),
  [],
  'negative: a common frame with one content word is not a copy',
)
assert.deepEqual(copiedPhrases('She baked bread until dawn.', shown), [], 'negative: nothing shared, nothing copied')
const everyday = ['The cable sang when the wind came down the valley, and both of them knew which step came next.']
assert.deepEqual(copiedPhrases('The door banged when the wind came in the night. By then both of them knew it.', everyday), [], 'negative: everyday verbs such as came and knew do not make a run a copy')
assert.deepEqual(copiedPhrases('The rope sang when the wind came down the valley.', everyday), ['sang when the wind came down the valley'], 'a run with a real content word beside them still counts')
assert.deepEqual(copiedPhrases('He set them down.', shown), [], 'negative: three shared words are under the length')

const example = ['She had written the times in a book. The first column was the hour.']
assert.deepEqual(
  copiedFrames('The oven ran hot. The first mark was the weight.', example),
  [{ reply: 'The first mark was the weight.', source: 'The first column was the hour.' }],
  'a sentence that keeps the frame and one word in place traces the example',
)
assert.deepEqual(copiedFrames('The old man was the king.', example), [], 'negative: the same frame with no word kept is ordinary English')
assert.deepEqual(copiedFrames('The first mark was the weight of the loaf.', example), [], 'negative: a longer build is not a trace')
assert.deepEqual(copiedFrames('The first column was the hour.', example), [], 'negative: the same sentence is a copied phrase, not a traced frame')

const opening = 'It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife.'
assert.equal(echoedOpening('It is a custom long kept on the lower river, that no ferry shall cross. The ice came.', opening), 'It is a custom long kept on the lower river, that no ferry shall cross.', 'a reply that opens on the source\'s first three words echoes it')
assert.equal(echoedOpening('It was a cold night on the river. The ice came.', opening), null, 'negative: a different opening is not an echo')
assert.equal(echoedOpening('The bakery at the quay was lit.', 'The kiln at the north end of the yard kept its heat.'), null, 'negative: the same first word alone is not an echo')

console.log('copied: ok')
