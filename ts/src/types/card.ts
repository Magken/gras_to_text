/** The text profile gras_to_text returns. The fields match spec/card.schema.json. */

export type FunctionWord = {
  feature: string
  rate: number
  z?: number
}

export type GuideLevel = 'chapter' | 'section' | 'paragraph' | 'sentence' | 'word'

export type GuideStep = {
  level: GuideLevel
  text: string
  /** Lines that hold only when the reply keeps the source's subject: subject words and names. */
  subject?: string
  excerpt?: string
}

/** Present, and empty, until that measure exists. */
export type EmptySection = Record<string, never>

/** One way a dictionary word is used, and how often. */
export type WordUse = {
  tag: string
  count: number
}

/** A word from a text, with the part-of-speech tags it actually takes. */
export type DictionaryWord = {
  word: string
  count: number
  uses: WordUse[]
}

/** A name as the writer spelled it, such as Dr. Hale, and how often it appears. */
export type NameEntry = {
  name: string
  count: number
}

/** A usage dictionary. `words` is absent until a text has been tagged into it. */
export type UsageDictionary = {
  words?: DictionaryWord[]
  /** People and places, kept in their case. Only the subject side carries names. */
  names?: NameEntry[]
}

export type SentenceType = 'simple' | 'compound' | 'complex' | 'fragment'

/** One paragraph, measured, with sentences a repair can quote. */
export type ParagraphSketch = {
  sentences: number
  words: number
  /** Words in each sentence, in order. */
  lengths: number[]
  /** Sentences that join two clauses or hang one on another. Absent when the text is untagged. */
  joined?: number
  /** The first two sentences. */
  opening: string
  longest: string
  /** The last sentence. */
  closing: string
}

/** A word that marks the register, such as upon, and how often the source uses it. */
export type MarkedWord = {
  word: string
  count: number
  /** What it signals, for example "an older, formal word". */
  kind: string
}

/** How formal the words are: long words and marked words. */
export type Register = {
  /** Share of words with three or more syllables. */
  long: number
  /** The long words the source repeats most, subject words left out. */
  longWords: string[]
  marked: MarkedWord[]
}

/** Share of sentences of each type. */
export type JoinRates = Record<SentenceType, number>

/** Marks per sentence. `quote` is the share of sentences with a double quote. */
export type Punctuation = {
  comma: number
  semicolon: number
  colon: number
  dash: number
  quote: number
  /** Share of sentences with at least one comma. */
  withComma?: number
  /** Share of commas that open a second clause, before and or because. */
  beforeJoin?: number
}

/** Shares of sentences with three habits of a voice, with the first source sentence for each. */
export type Figures = {
  /** A clause picks up the last word of the clause before, within one sentence. */
  chain: number
  /** A statement is followed by a second reading of it: ", or it was ...". */
  reread: number
  /** A short general statement in the present tense. */
  maxim: number
  examples: { chain?: string; reread?: string; maxim?: string }
}

/** One sentence shape: how a sentence opens, how it is built, a real example, and where it belongs. */
export type Arrangement = {
  /** The opening tags named in order, for example "determiner then noun then verb". */
  chain: string
  tags: string[]
  type: SentenceType
  count: number
  meaning: string
  /** A sentence from the source with this shape. */
  example: string
  /** Nouns of the paragraphs that use it. Empty when the shape is spread across the text. */
  topics: string[]
  paragraphs: number[]
  /** Sentences with this shape that open a paragraph. */
  opens?: number
  /** Sentences with this shape that close a paragraph of two or more. */
  closes?: number
}

/** The JSON dictionary: words, and the sentence shapes found with them. */
export type StoredDictionary = UsageDictionary & {
  arrangements?: Arrangement[]
}

export type TextProfile = {
  lexical: {
    functionWords: FunctionWord[]
    diversity: number
    rhythm: { q1: number; q2: number; q3: number; afterLong: number; spoken?: number }
    /** Long and marked words. Absent for an empty text. */
    register?: Register
  }
  syntactic: {
    tagRates: Record<string, number>
    sentenceStarts: string[]
    /** Sentence shapes for this text. Absent until the text is tagged. */
    arrangements?: Arrangement[]
    /** Share of sentences of each build. Absent until the text is tagged. */
    joins?: JoinRates
    punctuation?: Punctuation
    /** Absent when the text shows none of the three habits. */
    figures?: Figures
  }
  semantic: EmptySection
  functional: UsageDictionary
  /** Paragraph layout. Greetings and sign-offs are not read yet. */
  structural: { paragraphs?: ParagraphSketch[] }
  content: UsageDictionary
  language: EmptySection
  guide: GuideStep[]
}

export type TextMiss = {
  feature: string
  target: number
  actual: number
  note?: string
}

export type RenderView = 'prose' | 'json'
