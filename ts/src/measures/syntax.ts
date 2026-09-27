/** Tag shares, sentence openers, and a short pattern a bot can read. */

const BE = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'])

const TAG_NAMES: Record<string, string> = {
  DT: 'determiner',
  PDT: 'determiner',
  WDT: 'determiner',
  DET: 'determiner',
  NN: 'noun',
  NNS: 'noun',
  NNP: 'noun',
  NNPS: 'noun',
  NOUN: 'noun',
  PROPN: 'noun',
  VB: 'verb',
  VBD: 'verb',
  VBG: 'verb',
  VBN: 'verb',
  VBP: 'verb',
  VBZ: 'verb',
  VERB: 'verb',
  AUX: 'auxiliary',
  PART: 'particle',
  JJ: 'adjective',
  JJR: 'adjective',
  JJS: 'adjective',
  ADJ: 'adjective',
  RB: 'adverb',
  RBR: 'adverb',
  RBS: 'adverb',
  WRB: 'adverb',
  ADV: 'adverb',
  PRP: 'pronoun',
  'PRP$': 'pronoun',
  WP: 'pronoun',
  'WP$': 'pronoun',
  PRON: 'pronoun',
  IN: 'preposition',
  ADP: 'preposition',
  CC: 'conjunction',
  CCONJ: 'conjunction',
  SCONJ: 'conjunction',
  CD: 'number',
  NUM: 'number',
  MD: 'modal',
  TO: 'to',
}

export function tagRates(tags: string[]): Record<string, number> {
  if (tags.length === 0) return {}
  const counts: Record<string, number> = {}
  for (const tag of tags) counts[tag] = (counts[tag] ?? 0) + 1
  const rates: Record<string, number> = {}
  for (const [tag, count] of Object.entries(counts)) rates[tag] = count / tags.length
  return rates
}

const PUNCT_TAGS = new Set(['PUNCT', '.', ',', ':', '``', "''", '-LRB-', '-RRB-'])

/** The first word tag of each sentence; an opening quote mark or bracket is skipped. */
export function sentenceStartTags(sentences: string[][]): string[] {
  const starts: string[] = []
  for (const sentence of sentences) {
    const first = sentence.find((tag) => !PUNCT_TAGS.has(tag))
    if (first) starts.push(first)
  }
  return starts
}

export function tagLabel(tag: string): string {
  return TAG_NAMES[tag] ?? tag
}

/** The first content tags, named, joined so the guide can state the pattern. */
export function sentencePattern(tags: string[], limit = 6): string {
  const names: string[] = []
  for (const tag of tags) {
    const name = TAG_NAMES[tag]
    if (!name) continue
    names.push(name)
    if (names.length === limit) break
  }
  return names.join(' then ')
}

/**
 * Pronoun share, and how often a past participle follows a form of be.
 * `words` lines up with `tags`. A passive cannot be seen from tags alone.
 * Penn marks the participle as VBN. The English BERT tagger marks it VERB.
 */
export function syntaxRates(tags: string[], words: string[] = []): { pronoun: number; passive: number } {
  if (tags.length === 0) return { pronoun: 0, passive: 0 }
  let pronouns = 0
  for (const tag of tags) {
    if (tag === 'PRP' || tag === 'PRP$' || tag === 'PRON') pronouns += 1
  }
  let passive = 0
  const limit = Math.min(tags.length, words.length)
  for (let i = 0; i < limit - 1; i++) {
    const participle = tags[i + 1] === 'VBN' || tags[i + 1] === 'VERB'
    if (BE.has(words[i].toLowerCase()) && participle) passive += 1
  }
  return { pronoun: pronouns / tags.length, passive: passive / tags.length }
}
