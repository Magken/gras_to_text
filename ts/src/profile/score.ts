/** Signed gaps between a source profile and a new text. */

import { burrowsDelta } from '../measures/burrowsDelta.ts'
import { cosineSimilarity } from '../measures/cosineSimilarity.ts'
import type { InputFile } from '../input/readInput.ts'
import { dominantUse, keptSubjects } from '../profile/dictionary.ts'
import { shapePlace, shareText, shownShapes } from '../profile/arrangements.ts'
import { closeExample, longCount, openerShape, shortCloseShare } from '../profile/paragraphs.ts'
import { copiedFrames, copiedPhrases, echoedOpening, shownText, sourceOpening } from '../profile/copied.ts'
import { tokenizeWords } from '../input/tokenizeWords.ts'
import { afterLongShare } from '../measures/rhythm.ts'
import type { DictionaryWord, TextMiss, TextProfile } from '../types/card.ts'
import { runProfile } from '../versions/runProfile.ts'
import type { ProfileOptions } from '../versions/v1.ts'

function ratesOf(card: TextProfile): Record<string, number> {
  return Object.fromEntries(card.lexical.functionWords.map((word) => [word.feature, word.rate]))
}

function contentMiss(entry: DictionaryWord): TextMiss {
  const role = dominantUse(entry)
  return {
    feature: `content.${entry.word}`,
    target: entry.count,
    actual: 0,
    note: `${entry.word} is ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`,
  }
}

function zOf(card: TextProfile): Record<string, number> | null {
  if (!card.lexical.functionWords.some((word) => word.z !== undefined)) return null
  return Object.fromEntries(
    card.lexical.functionWords.filter((word) => word.z !== undefined).map((word) => [word.feature, word.z!]),
  )
}

export async function score(
  text: string | InputFile,
  card: TextProfile,
  options: ProfileOptions = {},
): Promise<TextMiss[]> {
  const reply = await runProfile(text, options)
  const sourceRates = ratesOf(card)
  const replyRates = ratesOf(reply)
  const misses: TextMiss[] = []
  const glue = new Map((card.functional.words ?? []).map((entry) => [entry.word, entry]))
  const features = new Set([...Object.keys(sourceRates), ...Object.keys(replyRates)])
  let rateGap = 0
  for (const feature of features) {
    const target = sourceRates[feature] ?? 0
    const actual = replyRates[feature] ?? 0
    rateGap += Math.abs(actual - target)
    const entry = glue.get(feature)
    misses.push({
      feature,
      target,
      actual,
      ...(entry ? { note: `${feature} is used as ${/^[aeiou]/i.test(dominantUse(entry)) ? 'an' : 'a'} ${dominantUse(entry)}.` } : {}),
    })
  }
  if (typeof text === 'string') {
    const replyWords = new Map<string, number>()
    for (const token of tokenizeWords(text)) {
      if (!/^[A-Za-z]/.test(token)) continue
      const word = token.toLowerCase()
      replyWords.set(word, (replyWords.get(word) ?? 0) + 1)
    }
    const missing = keptSubjects(card.content)
      .filter((entry) => (replyWords.get(entry.word) ?? 0) === 0)
    for (const entry of missing) misses.push(contentMiss(entry))
    const copied = copiedPhrases(text, shownText(card))
    misses.push({
      feature: 'copied',
      target: 0,
      actual: copied.length,
      ...(copied.length > 0 ? { note: copied.map((phrase) => `"${phrase}"`).join('; ') } : {}),
    })
    const echoed = echoedOpening(text, sourceOpening(card))
    misses.push({ feature: 'echoed', target: 0, actual: echoed ? 1 : 0, ...(echoed ? { note: echoed } : {}) })
    const framed = copiedFrames(text, shownText(card))
    misses.push({
      feature: 'framed',
      target: 0,
      actual: framed.length,
      ...(framed.length > 0 ? { note: framed.map((item) => `"${item.reply}" follows "${item.source}"`).join('; ') } : {}),
    })
    for (const entry of card.content.names ?? []) {
      if (text.includes(entry.name)) continue
      misses.push({
        feature: `name.${entry.name}`,
        target: entry.count,
        actual: 0,
        note: `${entry.name} is named in the source and not in the reply`,
      })
    }
  }
  const sourceRegister = card.lexical.register
  const replyRegister = reply.lexical.register
  if (sourceRegister && replyRegister) {
    misses.push({ feature: 'register.long', target: sourceRegister.long, actual: replyRegister.long })
    const replyMarked = new Map(replyRegister.marked.map((item) => [item.word, item.count]))
    const sourceMarked = new Map(sourceRegister.marked.map((item) => [item.word, item.count]))
    for (const item of sourceRegister.marked) {
      if (features.has(item.word) || item.count < 2 || replyMarked.has(item.word)) continue
      misses.push({ feature: `marked.${item.word}`, target: item.count, actual: 0, note: `${item.word}, ${item.kind}` })
    }
    for (const item of replyRegister.marked) {
      if (features.has(item.word) || sourceMarked.has(item.word)) continue
      misses.push({ feature: `marked.${item.word}`, target: 0, actual: item.count, note: `${item.word}, ${item.kind}` })
    }
  }
  for (const key of ['q1', 'q2', 'q3'] as const) {
    misses.push({
      feature: `rhythm.${key}`,
      target: card.lexical.rhythm[key],
      actual: reply.lexical.rhythm[key],
    })
  }
  if (card.lexical.rhythm.spoken !== undefined && reply.lexical.rhythm.spoken !== undefined) {
    misses.push({ feature: 'rhythm.spoken', target: card.lexical.rhythm.spoken, actual: reply.lexical.rhythm.spoken })
  }
  misses.push({ feature: 'diversity', target: card.lexical.diversity, actual: reply.lexical.diversity })
  const tags = new Set([...Object.keys(card.syntactic.tagRates), ...Object.keys(reply.syntactic.tagRates)])
  for (const tag of tags) {
    misses.push({
      feature: `tag.${tag}`,
      target: card.syntactic.tagRates[tag] ?? 0,
      actual: reply.syntactic.tagRates[tag] ?? 0,
    })
  }
  misses.push({ feature: 'rateGap', target: 0, actual: rateGap })
  misses.push({ feature: 'cosine', target: 1, actual: cosineSimilarity(sourceRates, replyRates) })
  const sourceZ = zOf(card)
  const replyZ = zOf(reply)
  if (sourceZ && replyZ) {
    misses.push({ feature: 'burrowsDelta', target: 0, actual: burrowsDelta(sourceZ, replyZ) })
  }
  const sourceJoins = card.syntactic.joins
  const replyJoins = reply.syntactic.joins
  if (sourceJoins && replyJoins) {
    misses.push({
      feature: 'joins.joined',
      target: sourceJoins.compound + sourceJoins.complex,
      actual: replyJoins.compound + replyJoins.complex,
    })
    misses.push({ feature: 'joins.fragment', target: sourceJoins.fragment, actual: replyJoins.fragment })
  }
  if (card.syntactic.punctuation && reply.syntactic.punctuation) {
    misses.push({ feature: 'punct.comma', target: card.syntactic.punctuation.comma, actual: reply.syntactic.punctuation.comma })
  }
  const figures = card.syntactic.figures
  if (figures) {
    for (const habit of ['chain', 'reread', 'maxim'] as const) {
      if (figures[habit] > 0 && figures.examples[habit]) {
        misses.push({ feature: `figure.${habit}`, target: figures[habit], actual: reply.syntactic.figures?.[habit] ?? 0, note: figures.examples[habit] })
      }
    }
  }
  const pronounOf = (rates: Record<string, number>) =>
    ['PRP', 'PRP$', 'PRON', 'WP', 'WP$'].reduce((sum, tag) => sum + (rates[tag] ?? 0), 0)
  if (Object.keys(card.syntactic.tagRates).length > 0 && Object.keys(reply.syntactic.tagRates).length > 0) {
    misses.push({ feature: 'syntax.pronoun', target: pronounOf(card.syntactic.tagRates), actual: pronounOf(reply.syntactic.tagRates) })
  }
  const sourceParagraphs = card.structural.paragraphs ?? []
  const replyParagraphs = reply.structural.paragraphs ?? []
  if (sourceParagraphs.length > 0) {
    misses.push({ feature: 'paragraphs.count', target: sourceParagraphs.length, actual: replyParagraphs.length })
  }
  if (sourceParagraphs.length > 0 && replyParagraphs.length > 0) {
    const perParagraph = (sketches: typeof sourceParagraphs) => sketches.reduce((sum, sketch) => sum + sketch.sentences, 0) / sketches.length
    misses.push({ feature: 'paragraphs.size', target: perParagraph(sourceParagraphs), actual: perParagraph(replyParagraphs), note: String(replyParagraphs.length) })
  }
  const long = card.lexical.rhythm.q3
  if (sourceParagraphs.length > 0 && sourceParagraphs.length === replyParagraphs.length) {
    sourceParagraphs.forEach((source, index) => {
      const replied = replyParagraphs[index]
      const sourceMean = source.words / Math.max(source.sentences, 1)
      const replyMean = replied.words / Math.max(replied.sentences, 1)
      const gap = Math.abs(sourceMean - replyMean) / Math.max(sourceMean, 1)
      const sourceLong = longCount(source, long)
      const replyLong = longCount(replied, long)
      if (gap < 0.3 && Math.abs(sourceLong - replyLong) < 2) return
      const shorter = replyMean < sourceMean
      const fix = gap >= 0.3
        ? shorter ? 'Join the short ones until they read like that.' : 'Split the long ones until they read like that.'
        : replyLong < sourceLong
          ? `Keep the paragraph length, but let ${sourceLong} of its sentences run ${Math.round(long)} words or more, with short ones between.`
          : `Keep the paragraph length, but cut the sentences of ${Math.round(long)} words or more down to ${sourceLong === 0 ? 'none' : sourceLong}.`
      const longNote = sourceLong !== replyLong
        ? ` The source paragraph has ${sourceLong} ${sourceLong === 1 ? 'sentence' : 'sentences'} of ${Math.round(long)} words or more; the reply has ${replyLong === 0 ? 'none' : replyLong}.`
        : ''
      misses.push({
        feature: `paragraph.${index + 1}`,
        target: sourceMean,
        actual: replyMean,
        note: `Paragraph ${index + 1}. The reply says it in ${replied.sentences} sentences of about ${Math.round(replyMean)} words: "${replied.opening}" The source used ${source.sentences} sentences of about ${Math.round(sourceMean)} words, such as "${source.longest}"${longNote} ${fix}`,
      })
    })
  }
  const replyLengths = replyParagraphs.flatMap((sketch) => sketch.lengths)
  if (replyLengths.slice(0, -1).filter((length) => length >= long).length >= 3) {
    misses.push({
      feature: 'rhythm.afterLong',
      target: card.lexical.rhythm.afterLong,
      actual: afterLongShare(replyLengths, card.lexical.rhythm.q1, long),
    })
  }
  const typical = card.lexical.rhythm.q2
  const sourceClose = shortCloseShare(sourceParagraphs, typical)
  const replyClose = shortCloseShare(replyParagraphs, typical)
  if (sourceClose !== null && replyClose !== null) {
    const example = closeExample(sourceParagraphs, typical)
    misses.push({
      feature: 'paragraphs.shortClose',
      target: sourceClose,
      actual: replyClose,
      note: replyClose < sourceClose
        ? `Paragraph ends. In the source, ${shareText(sourceClose, 1)} paragraphs end on a short sentence after longer ones; in the reply, ${shareText(replyClose, 1)}. End more paragraphs on a short, plain sentence.${example ? ` Such as: "${example}"` : ''}`
        : `Paragraph ends. In the source, ${shareText(sourceClose, 1)} paragraphs end on a short sentence; in the reply, ${shareText(replyClose, 1)}. Let more paragraphs end on a full-length sentence.`,
    })
  }
  const opener = openerShape(card.syntactic.arrangements, sourceParagraphs.length)
  if (opener && replyParagraphs.length > 0 && (reply.syntactic.arrangements ?? []).length > 0) {
    const replyOpens = reply.syntactic.arrangements?.find((shape) => shape.chain === opener.chain && shape.type === opener.type)?.opens ?? 0
    const target = (opener.opens ?? 0) / sourceParagraphs.length
    const actual = replyOpens / replyParagraphs.length
    misses.push({
      feature: 'paragraphs.opener',
      target,
      actual,
      note: `Paragraph openings. In the source, ${shareText(target, 1)} paragraphs open this way: ${opener.meaning} In the reply, ${shareText(actual, 1)}. Open more paragraphs like this: "${opener.example}"`,
    })
  }
  const sourceShapes = card.syntactic.arrangements ?? []
  const replyShapes = reply.syntactic.arrangements ?? []
  const sourceSentences = Math.max(sourceShapes.reduce((sum, item) => sum + item.count, 0), 1)
  const replySentences = Math.max(replyShapes.reduce((sum, item) => sum + item.count, 0), 1)
  if (replyShapes.length > 0) {
    for (const item of shownShapes(sourceShapes)) {
      if (item.count < 2) continue
      const actual = replyShapes.find((shape) => shape.chain === item.chain && shape.type === item.type)?.count ?? 0
      const sourceShare = item.count / sourceSentences
      const replyShare = actual / replySentences
      if (replyShare >= sourceShare * 0.5) continue
      const about = item.topics.length > 0
        ? ` Use it where the paragraph is about ${item.topics.join(', ')}.`
        : ''
      misses.push({
        feature: `arrangement.${item.type}.${item.chain}`,
        target: sourceShare,
        actual: replyShare,
        note: `${item.meaning}${shapePlace(item, sourceShapes)} The source opens ${shareText(item.count, sourceSentences)} sentences this way. The reply does it in ${shareText(actual, replySentences)}. Put that shape back, like this: "${item.example}"${about}`,
      })
      if (misses.filter((miss) => miss.feature.startsWith('arrangement.')).length === 3) break
    }
  }
  return misses
}
