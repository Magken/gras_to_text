# Notes

Working notes for the gras_to_text readings. The reading list and the PDFs stay in [sources.md](sources.md). When a paper is explained in chat, add the explanation here in the same session.

A 1 means Table 1 of Stamatatos lists that tool for that row, including tools he put in brackets as optional. A 0 means he does not list it. The optional ones are named under the tables.

## Stamatatos, Table 1

The levels stack. Characters need no words. Words need a tokenizer. Arrangement needs those words plus a tagger and then a parser. Meaning needs the arrangement, plus a thesaurus or a meaning parser.

A thesaurus is a list of words that share a meaning. *big* and *large* sit together. WordNet is the thesaurus McCarthy used for the synonym row.

### Words, arrangement, and meaning

| Feature | Tokenizer | Sentence splitter | Stemmer | Lemmatizer | POS tagger | Text chunker | Partial parser | Full parser | Thesaurus | Semantic parser |
|---|---|---|---|---|---|---|---|---|---|---|
| Lexical, token-based | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, vocabulary richness | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, word frequencies | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, word n-grams | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, errors | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, types | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, fixed n-grams | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, variable n-grams | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, compression | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, part of speech | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, chunks | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| Syntactic, phrase structure | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 |
| Syntactic, rewrite rules | 1 | 1 | 0 | 0 | 1 | 1 | 0 | 1 | 0 | 0 |
| Syntactic, errors | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Semantic, synonyms | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 |
| Semantic, dependencies | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 1 |
| Semantic, functional | 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Application, structural | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Application, content-specific | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Application, language-specific | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

### Tools that only some rows use

| Feature | Character dictionary | Feature selector | Compression tool | Orthographic spell checker | Syntactic spell checker | Specialized dictionaries | HTML parser | Specialized parsers |
|---|---|---|---|---|---|---|---|---|
| Lexical, token-based | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, vocabulary richness | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, word frequencies | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, word n-grams | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Lexical, errors | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| Character, types | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, fixed n-grams | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, variable n-grams | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Character, compression | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, part of speech | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, chunks | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, phrase structure | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, rewrite rules | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Syntactic, errors | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Semantic, synonyms | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Semantic, dependencies | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Semantic, functional | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| Application, structural | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| Application, content-specific | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| Application, language-specific | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |

Optional in the paper, still a 1 above: sentence splitter on token-based measures; stemmer and lemmatizer on word frequencies, content-specific features, and language-specific features; POS tagger on chunks and on synonyms.

What each row is:

- Token-based counts word length and sentence length. The sentence splitter is only needed for the sentence length.
- Vocabulary richness is how many different words appear. It grows with the length of the text, so it is a weak measure on its own.
- Word frequencies are the Mosteller counts. A stemmer or a lemmatizer can fold *ran* and *running* together first.
- Fixed character n-grams need no tool. The text is already letters.
- Compression zips an author's essays, sticks the mystery text on the end, and zips again. The growth in file size is the score. Smaller growth means the closer author.
- Part of speech is the first syntax row: tokenizer, sentence splitter, tagger.
- Chunks group words into phrases. Phrase structure adds a partial parser. Rewrite rules add a full parser. That last row is the Baayen measure.
- Functional sits under semantic. A dictionary ties *specifically* to a meaning label such as clarification, and the POS tagger checks that the word is playing the allowed role. It is words plus arrangement plus a meaning list. It is not the application-specific group.
- Application-specific features exist only for one kind of document: an email sign-off, HTML tags, or *sale* in a for-sale forum. They are not a blend of the four levels.

The paper is a survey. He does not train one classifier on every row. A profile method merges one author's texts into one list and picks the nearest list. An instance method keeps each text as its own row and trains a classifier.

## Tools we will use

The table above is the map. This is the short list for the measures already sketched: word rates, character n-grams, syntax rates, diversity, and sentence rhythm. Three tools. The rest is counting code.

| Job | Tool | Feeds |
|---|---|---|
| Word tokenizer | Our own cut into whole words. BERT's tokenizer is not this tool. It splits `playing` into pieces, and those pieces are glued back onto the word before anything is counted. | Word rates, diversity, rhythm |
| Sentence splitter | A splitter of its own. The BERT tagger does not find sentence breaks. | Sentence length |
| Part-of-speech tagger | The English BERT tagger, already trained, run through `@huggingface/transformers`. The model family is `vblagoje/bert-english-uncased-finetuned-pos`. The package loads the ONNX copy `jdp8/bert-english-uncased-finetuned-pos`, because the original repo has no ONNX file. One job: a tag on each word. The tags are the universal set, such as DET, NOUN, and VERB. | Syntax rates. In this version those rates are tag rates, not TOSCA rewrite rules. |

Counted in this package, with no extra library: character n-grams, the closed list of function words, MTLD, z-scores, Burrows's Delta, and cosine.

Left off, because none of those measures need them: stemmer, lemmatizer, chunker, partial parser, full parser, thesaurus, semantic parser, spell checkers, compression, HTML parser.

## Two profiles

The same measures run twice. What changes is whether there is a second text.

**Generation.** One text in. A standalone profile out: function-word rates against a background, tag rates, diversity, sentence-length shape, and a few short excerpts. Rendered as the guide sheet. Burrows's Delta is absent here, because Delta is a distance between two texts. Z-scores against a general background can still be on the card. They say what is unusual about this text, not how far it sits from a rewrite.

**Regeneration.** The same measures on the new text. Subtract feature by feature from the source profile. The guide sheet states those gaps in the same order: which sentence shapes, which tags, which words moved, and what to put back. Burrows's Delta is one summary number for the pair, useful to see if the rewrite got closer. The model needs the ordered gaps, not that single number.

PCA is for a pile of texts, to see which mix of features spreads them. Two texts do not need it. The gaps are already the list of what changed.

The Stamatatos stack is every row of his table: characters, words, syntax, meaning, and features that only exist for one kind of document. The card is the guide sheet, not that whole table.

Off the card for ordinary English: character n-grams, compression, and word n-grams. They are strong for naming an author and hard to hand to a model as an instruction. Character measures come back only for a writing system without spaces, such as Chinese or Japanese. Word n-grams mostly repeat word rates and tag rates.

Each measure is its own function. The profile holds their results in sections that sit side by side: lexical, syntactic, semantic, and the four application summaries. The synthesizer reads those sections, keeps the few stable ones, and writes a guide sheet that is passed on. The guide sheet is the card. The counts stay in the profile. The sheet tells a bot how to produce a text of this kind, in order, not a pile of observations. The application summaries are sections of the profile, not the basket the other sections are poured into.

The sheet is a hierarchy. The bot reads the largest unit the text actually has, and builds downward. A level that is not in the text is left out. A paragraph has no chapter. A book does. Each level says how that unit is constructed, then names the level inside it. A short excerpt sits under the level it illustrates.

1. Chapter, when the source is divided into chapters. How a chapter opens, how long it runs, and how the next chapter follows.
2. Section, inside the chapter, when the source has headings or marked parts. How a section opens and how it sits against the next one.
3. Paragraph. How many, how long, how one opens and closes, and how the next follows. A greeting or a sign-off belongs here when the document has one.
4. Sentence, inside the paragraph. How long a sentence runs, how it tends to start, and the part-of-speech shape of a typical sentence.
5. Word, inside the sentence. Which filler words to lean on, which to leave alone, and how the writer qualifies or joins a point when that meaning dictionary exists.

The counts are made in the other direction. Words are counted first, then gathered into sentences, paragraphs, sections, and chapters. The sheet is written largest first so the bot knows where to put the smaller pieces. On a regeneration, the same levels are written as corrections: what moved at that level, and what to put back. The order does not change.

Input decides which levels can be filled. A JSON document that already names chapters, sections, and paragraphs can use every level it marks. A raw paste usually cannot. Blank lines are enough for paragraphs. The sentence splitter and the word cut still run. Chapters and sections stay empty unless the paste has headings or some other mark that separates them. The guide does not invent a chapter for text that has none.

## Version 1

The functions stay in their folders. The main loop is a version. Version 1 lives in `projects/gras_to_text/ts/src/versions/v1.ts`. `profile(input)` runs that loop. `profile(input, { version: 1 })` names it. A later loop is a new file, such as `v2.ts`, added to the list in `runProfile.ts`. The old file stays, so a caller can still run version 1 after version 2 exists. A version picks the functions it wants. It does not copy them.

Version 1 reads the input, counts words first, and writes the guide from the largest unit the text actually has. When the input has no tags, it runs the English BERT tagger once on each sentence the splitter already found, then glues WordPiece pieces back onto whole words before any count. Tags already on the JSON stay, and the model is not called. `profile(input, { tag: false })` leaves an untagged paste untagged. It does not call the character n-gram function. `render` turns that guide into text for a bot. `score` runs the same measures on a second text and returns the signed gaps. `reportMisses` turns those gaps into the correction the bot should follow. Burrows Delta is included when both profiles have z-scores.

`readInput` is the one input function. Version 1 accepts five kinds:

| Kind | What it reads |
|---|---|
| text | A paste. Blank lines are paragraphs. No chapter is invented. |
| json | A document that already names chapters, sections, and paragraphs. A paragraph may also carry sentences and tags that someone has already marked. |
| markdown | `#` is a chapter and `##` is a section. The body is paragraphs. |
| pdf | The words of a PDF file. |
| docx | The words of a Word file. |

A file path uses the extension. `.txt`, `.json`, `.md`, `.pdf`, and `.docx` are the ones version 1 knows.

The lexical section is the structural output of those word and sentence counts:

```
lexical: {
  functionWords: [{ feature, rate, z? }],
  diversity,
  rhythm: { q1, q2, q3 }
}
```

`functionWords` is the starter filler list, including *the*, *of*, and *upon*. `rate` is the share of words. `z` is present only when the caller passes a background. `diversity` is MTLD at 0.72. `rhythm` is the sentence-length quartiles, in words.

Tags go in `syntactic.tagRates` and `syntactic.sentenceStarts`. The sentence line states a short pattern, such as determiner then noun then verb, plus the pronoun share and a passive when a past participle follows a form of *be*. A filler word whose rate is 0 is left off the word line.

`buildDictionary` reads any input version 1 can read and stores a usage dictionary as JSON. Each word keeps the part-of-speech tags it actually takes, and how often. The same JSON stores an arrangement dictionary of sentence shapes. A shape is how a sentence opens, its first three tags, plus how it is built: one clause, two clauses joined with *and* or *but*, a clause hung on *because*, *as*, or *that*, or no main verb. Each shape keeps one real sentence from the source. It carries the nouns of its paragraphs only when it sits in about a third of them or fewer; a shape spread across the text has no topic. An earlier cut into fixed chains of three tags was dropped, because a chain started mid-phrase and named no sentence. A title and name such as Mr. Pell fill one opening slot, even when the tagger tags the dot as part of the name. Names such as Dr. Hale are kept apart from the subject words, in the case the writer used. `addToDictionary` adds another text onto that JSON without changing the copy already stored. Passed into `profile` as `dictionary`, that list is what the guide is induced from. Nouns and adjectives are the subject words in `content`. Glue words go in `functional`, with the role each one plays, such as *the* used as a determiner.

The guide is written for a model, not for a statistician. Lengths are a mix to aim for, such as a quarter at 6 words or fewer. Shares read as about 3 in 10, not as counts or long decimals. Each sentence shape has what it does and a source sentence to copy. The build mix and commas per sentence say whether to join clauses. Each level shows a different source sentence. Register is read from the source's own words: the share of long words, three syllables or more, and the marked words it actually uses, older and formal such as *upon* and *whom*, formal linking such as *thus*, or informal. Glue words are given with their rates, and the rare ones are named as rare, because a bare list made a writer overuse *in*. The paragraph line says which paragraphs hold the long sentences, how often a paragraph ends on a short sentence, and which opener is common. A shape names its place in a paragraph only when it opens or closes one well above the base rate. The rendered text has two modes. Generation leaves out subject words and names, because they make a model copy the subject. It says the quoted sentences show how to build, not what to say, and its repair list does not ask for the source's subject words. A rewrite keeps them. The sheet and the repair count two-clause sentences the same way: joined with *and* or hung on *because* both count. Tag chains and glue roles stay in the profile and off the text; a model already knows *the* is a determiner.

`score` runs the same measures on the reply. When both texts have the same paragraph breaks, it pairs the paragraphs and quotes the reply's sentences beside the source's. `reportMisses` opens with one line on what happened, then at most eight fixes, largest first: lengths, joins, glue words, dropped subject words and names, the paragraphs that moved most, and lost sentence shapes. It ends with what already matches, so the reply is not over-corrected. Each fix gives a range and where to stop, such as 9 to 11 words, so a writer does not overshoot. The subject words a repair names are the ones the sheet showed. A new text that shares a run of four or more words, two of them content words, with the sheet's examples is told to say it another way; a rewrite is not. Tag rates, cosine, and Burrows Delta stay in the misses and off that text.

The sheet is tested two ways beyond the unit checks. Held out: the first half of a text is profiled, and its second half must score closer than another author's half. On the essay that holds clearly. On the opening of *Pride and Prejudice* Delta separates the two authors well, but the miss count barely does, 11 against 12. Blind: writers who never saw the source wrote on a new subject, one from the sheet and one from a one-line brief. With the current sheet, the sheet writer had fewer style misses (6 against 11) and a slightly lower Delta. A blind reader picked that text as closer to the voice. The reader also named what the sheet does not yet measure: clauses that pick up the last word of the clause before, a statement followed by a second reading of it, short general maxims, and a reply that copies one source sentence's frame with new nouns. `semantic` still needs a meaning label such as clarification. `structural` holds one sketch per paragraph (sentences, words, joined sentences, the opening, and the longest sentence) so a repair can quote it. Greetings and sign-offs are still not read. `language` stays empty for ordinary English. `guide` is the sheet: chapter, section, paragraph, sentence, word, and a level the text does not have is left out.

The blind batch repeats that test on four subjects and two sources, eight sheet stories against four brief-only ones, with its pass marks fixed before scoring. The first round showed what writers do with a bare rate: they fall back to ordinary prose. They cut the long sentences short, and wrote the glue words and pronouns at everyday rates whatever the source used. So the sheet now sets those rates against ordinary English. The glue-word rates come from the Brown corpus, the million-word sample of 1961 American prose counted by Kučera and Francis (1967). The pronoun share is set against about 1 in 9 words in ordinary narrative. The second round showed the opposite fault. A blanket "name the person again" line drove pronouns to half the source rate. The line now gives a share to rename, sized by the gap. On the third round every mark passed, and each sheet's stories sat closer to their own source than to the other in all four subjects. By Delta, a sheet closes about a quarter to a third of the distance from brief-only writing to the source's own halves. The frame check does not catch an echo of an opening line's rhetoric that shares no glue skeleton.

Part-of-speech tags are assigned once, on the words, in order. The BERT tagger does that job. The Markov models in the textbook are the older way to pick the best tag sequence. They are not rerun at each level of the sheet. A paragraph does not get its own tag set.

The tags are then gathered upward, and they live in the syntactic section of the profile:

- Word. The tag on that word, and which tags the writer leans on.
- Sentence. The shape of the tag sequence: how the sentence starts, and a short pattern such as pronoun then verb then noun. The raw list of every tag stays in the profile. The guide states the pattern.
- Paragraph, section, and chapter. Only a summary of the sentences inside them, such as whether the opening sentence is built differently from the ones that follow. No new tags are invented at these levels.

Lexical rates do not use the tags. A later meaning dictionary can check that a phrase has the allowed tag. That check is the semantic section, and it is optional.

His four application summaries, and where they actually sit:

- Functional is how the glue words are used. The usage dictionary records that *the* is a determiner in this text, not only that its rate is high. A meaning label such as clarification, tied to a phrase such as *specifically*, is still the semantic section.
- Structural is layout: paragraphs, greeting, sign-off, indentation, HTML. Version 1 reads only the paragraphs. It does not fall under lexical. Sentence length, which is lexical, is the part that looks similar.
- Content is topic words such as *sale*, each with the tags it takes in the text. The guide names the repeated ones and the role they play, so a reply can keep the subject. A word that appears once stays in the JSON and stays off the guide until another text adds to its count.
- Language is a feature that exists in only one language, such as formal versus informal Greek endings. Empty for ordinary English. This is the slot for Chinese or Japanese character measures.

## Mosteller and Wallace, 1963

Twelve disputed Federalist essays. Filler words (*upon*, *whilst*, *by*) have steady rates. Topic words (*war*) do not. Hamilton uses *upon* about 3 times per thousand words. Madison uses it about 1/6 as often. They keep 30 words. Both methods say Madison wrote all 12.

A word's weight is the gap between the two men's typical rates, shrunk when the rate jumps around. Importance is how many points that one word adds to the score of a typical Hamilton essay minus a typical Madison essay. *upon* is about four times the next word. The groups are a caution label stuck on beforehand: low numbers are function words, high numbers might be topic words. On the held-back essays, the topic groups stopped separating the authors.

Distributions, on one word. Four sentences, counting *his*:

| Sentence | Text | Times *his* appears |
|---|---|---|
| 1 | The cat sat down. | 0 |
| 2 | I saw his hat. | 1 |
| 3 | The sun was hot. | 0 |
| 4 | I took his bag and his key. | 2 |

The curve is how many sentences have each count: two sentences have 0, one has 1, one has 2. That is the frequency of the count. *his* has its own curve. *upon* has another. The words are not mixed.

| Name | What it describes | What you hand it |
|---|---|---|
| Binomial | hits in a fixed number of spots | each word-spot is a yes or a no |
| Poisson | a rare hit count | only the count, plus the average count |
| Negative binomial | a Poisson whose average wanders | words that bunch, such as *his* |
| Normal | a bell around an average | the finished essay score, not the yes/no spots |
| Bayes | not a shape | the chances from a shape, turned into odds for an author |

*upon* fits a Poisson. *his* has a thicker tail, so they use the negative binomial. The weight-rate half barely uses the shape. The Bayes half needs it. One *upon* count can pull toward Hamilton. The product over all the kept words pulls back to Madison.

## Baayen, van Halteren, and Tweedie, 1996

They cut each text into slices of exactly 2,000 words and drop the leftover. Fifty-nine slices. The columns are the fifty most common words in the pooled slices. Each cell is that word's share of that slice.

PCA does not pick the words. It mixes the columns into scores. The first score is the biggest way the slices differ. In the pilot that was the kind of writing: science and criticism on one side, speech-heavy writing on the other. Stewart and Innes are the same person, and his criticism sat with the science, not with his own novel. The author split showed up on a later, smaller score.

TOSCA is Tools for Syntactic Corpus Analysis, the Nijmegen parse of these texts. Each node has what the piece is (noun phrase), the job it does (subject), and marks such as singular. They turn the tree into rewrite rules, such as a noun phrase splitting into a determiner plus a noun, and count those rules the way other studies count words.

They compared four tables, all scored with PCA. Plain words count *and* once. The blend still counts words, but splits *and* by its job: joining nouns is one column, joining clauses is another. Rewrite rules drop the words and count the patterns. Inside crime fiction, the rewrite table separated Innes and Allingham more cleanly than the word table. A change of register can hide the author.

## Kešelj, Peng, Cercone, and Thomas, 2003

An n-gram is n letters in a row. They slice bytes, not words, and they tried lengths 1 through 10. On the English books the runs they trust are length 4 to 8, keeping the 500 to 3,000 most common slices.

A profile is that list and the rates. Two texts are close when the rates are close. Length 2, by hand:

Sentence A, `hahaha`, windows `ha ah ha ah ha`. So `ha` is 3/5 and `ah` is 2/5.

Sentence B, `hah hah`, windows `ha`, `ah`, `h` plus a space, space plus `h`, `ha`, `ah`. With only the two most common slices kept, the profile is `ha` 2/6 and `ah` 2/6. The space slices are dropped because they are rare.

This is a rate list, like Mosteller's word rates, with letter slices instead of words. They do not build the frequency-of-the-count curve, and they do not fit a Poisson.

## MTLD

Named at the start, before the papers. It is a diversity score that does not shrink just because the text is long.

Raw diversity is different words divided by all words. A short text looks richer than a long one, because a long text repeats itself. MTLD walks forward and starts a fresh stretch whenever that ratio falls to 0.72. The score is the average length of those stretches. A writer who keeps using new words gets longer stretches and a higher score.

MATTR is the simpler version named beside it. Take a window of a fixed number of words, compute different-words divided by window length, slide the window, and average those ratios.

This is the vocabulary-richness row in the Stamatatos table. It is lexical. It does not use meaning, and it is not a word n-gram. An n-gram keeps the actual slice, such as *the cat*. MTLD only asks whether the next word is new inside the current stretch. It also does not make a frequency table of how often each word appears. A repeat lowers the score whether the repeated word is *the* or *upon*. The sliding window is MATTR. MTLD grows the stretch until the ratio hits 0.72, then starts again.

## Evert, Proisl, Jannidis, Pielström, Schöch, and Vitt, 2015

Start with the words. Three short texts, and two words:

| Text | Rate of *the* | Rate of *of* |
|---|---|---|
| A | 6 | 2 |
| B | 4 | 4 |
| C | 2 | 6 |

A z-score is for one word in one text. Take *the*. The three rates are 6, 4, and 2. The average is 4. The step from the average to the high one, and from the average to the low one, is 2. That step is the spread. Each text's z-score is `(its rate - average) / spread`:

| Text | *the* | *of* |
|---|---|---|
| A | (6 − 4) / 2 = 1 | (2 − 4) / 2 = −1 |
| B | (4 − 4) / 2 = 0 | (4 − 4) / 2 = 0 |
| C | (2 − 4) / 2 = −1 | (6 − 4) / 2 = 1 |

Zero means this text uses the word about as often as the others. A positive number means more than usual. A negative number means less. The z-score is a rescaling: subtract the average, then divide by the spread, so every word is measured in the same steps. A common word and a rare word can then be compared. Each text is now a pair of numbers. That pair is the arrow.

Burrows's Delta and Cosine Delta start from those pairs.

Burrows's Delta answers one question: how far apart are these two texts, on the common words? The smaller number is the closer pair. An unknown text is given to the known author whose texts sit nearest. It is one number for a pair of texts. It does not add up the scores inside one text. For each word, subtract one text's z-score from the other's, ignore the minus sign, then add those gaps.

| Word | Text A | Text C | Gap |
|---|---|---|---|
| *the* | 1 | −1 | 2 |
| *of* | −1 | 1 | 2 |

Delta for the pair A and C is 2 + 2 = 4. A graph of it has the words along the bottom and the gap as the height. The texts are the two columns being compared, not the bottom axis.

The z-score uses the bell curve: most texts sit near the average, and few sit far out. A cosine wave is a different picture. It keeps rising and falling. The bell rises once and falls off on both sides. Cosine Delta does not wrap that bell into a circle.

Cosine similarity and Cosine Delta read the same two lists as arrows. Cosine similarity is one number from −1 to 1: 1 means the same direction, 0 means a right angle, and −1 means opposite directions. Cosine Delta is the angle you read off that number: 1 becomes 0 degrees, 0 becomes a right angle, and −1 becomes a half turn. Same direction means an angle of 0, so the texts match. In the pair above, one arrow points along the first word and the other along the second word, so the angle is a right angle and the similarity is 0.

| Text | Word 1 | Word 2 | What the arrow does |
|---|---|---|---|
| A | 2 | 0 | points along word 1 |
| B | 0 | 2 | points along word 2 |
| C | 1 | 1 | points halfway between them |
| D | 2 | 2 | same direction as C, longer arrow |

A and B are far apart by both measures. C and D point the same way, so cosine similarity is 1 and Cosine Delta is 0. Burrows's Delta still sees a gap, because D's numbers are bigger. That is why Cosine Delta cares about the pattern of which words are high, and Burrows's Delta also cares about how large the numbers are.
