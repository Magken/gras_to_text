# Sources

Read in this order. Working notes, including the tool matrix, are in [notes.md](notes.md).

Cite each paper at its published URL. This repository does not include the PDFs. If you keep a local copy for study, put it in `papers/` under the name below; that folder is gitignored.

## 1. Jurafsky and Martin, part-of-speech tagging

Daniel Jurafsky and James H. Martin, *Speech and Language Processing*, chapter 8, the archived October 2019 text. The part to read is section 8.4, and inside it the Viterbi algorithm.

- Local copy (gitignored): `papers/jurafsky-martin-pos-viterbi.pdf`
- Chapter index: https://web.stanford.edu/~jurafsky/slp3/
- This copy: https://web.stanford.edu/~jurafsky/slp3/old_oct19/8.pdf

A tagger has to choose a tag for every word, and the tags depend on each other. An HMM treats the tags as hidden states and the words as what you see. Two tables run it. The transition table says how often one tag follows another. The emission table says how often a tag produces a given word. The best tag sequence is the one that makes the sentence most probable under those two tables.

Trying every sequence is impossible, so Viterbi keeps a lattice: one column per word, one row per tag. Each cell stores only the best way to reach that tag at that word, which is the best cell in the previous column, times the transition into this tag, times the chance this tag emitted this word. A backpointer remembers which previous tag won. At the last word you take the best cell and walk the pointers backward. That walk is the tag sequence. Their worked sentence is "Janet will back the bill."

## 2. Mosteller and Wallace, the Federalist papers

Frederick Mosteller and David L. Wallace, "Inference in an Authorship Problem," *Journal of the American Statistical Association*, 1963.

- Local copy (gitignored): `papers/mosteller-wallace-1963.pdf`
- https://gwern.net/doc/statistics/bayes/1963-mosteller.pdf

Twelve Federalist papers were claimed by both Hamilton and Madison. Sentence length does not separate them. Topic words such as "war" or "legislature" move with the subject, so they are unsafe. Filler words — articles, prepositions, conjunctions — stay steadier. The strongest single word they found is "upon," which Hamilton uses far more than Madison. "whilst" leans the other way. They screened a large pool down to 30 words in five groups and compared a classical discriminant with a Bayesian analysis. Both say Madison wrote all 12 disputed papers.

What to keep: rate the closed class against a background, and do not let content words pretend to be style.

## 3. Stamatatos, the survey

Efstathios Stamatatos, "A Survey of Modern Authorship Attribution Methods," *Journal of the American Society for Information Science and Technology*, 2009.

- Local copy (gitignored): `papers/stamatatos-2009-survey.pdf`
- https://www.clips.uantwerpen.be/~walter/educational/material/Stamatatos_survey2009.pdf

This is the map of the field after Mosteller and Wallace. Early stylometry invented hundreds of measures and judged them by eye on long literary works, a handful of authors, and no control for topic. From the late 1990s the work became a text-classification problem: short noisy texts, many candidate authors, and a shared test set.

He sorts style measures by what you need in order to count them.

- Lexical measures need a tokenizer: word and sentence length, vocabulary richness, word frequencies, word n-grams. Vocabulary richness shifts with text length, so it is a poor measure on its own. Function words are the useful lexical features because writers use them without thinking and they are not tied to the topic. A few hundred frequent words are enough. Topic classification needs thousands.
- Character measures need almost nothing: character types, fixed-length character n-grams, compression. They survive messy text and languages without spaces.
- Syntactic measures need a tagger or a parser: part-of-speech rates, chunks, phrase structure, rewrite-rule frequencies.
- Semantic and application-specific measures need still more (a thesaurus, a parser, or markup).

Accuracy depends on how many authors you have, how long the texts are, and how much undisputed text you hold. He also says the field still struggles to explain a style, not only to name an author, and that most tests assume the true author is already in the candidate list.

## 4. Evert, Proisl, Jannidis, Pielström, Schöch, and Vitt on Delta

Stefan Evert, Thomas Proisl, Fotis Jannidis, Steffen Pielström, Christof Schöch, and Thorsten Vitt, "Towards a Better Understanding of Burrows's Delta in Literary Authorship Attribution," NAACL workshop on Computational Linguistics for Literature, 2015.

The anthology PDF at this address is this paper. A shorter piece by Jannidis and the Würzburg authors, "Improving Burrows' Delta," is a different 2015 conference abstract that this paper cites.

- Local copy (gitignored): `papers/jannidis-2015-burrows-delta.pdf`
- https://aclanthology.org/W15-0709.pdf

Burrows's Delta represents a text by the relative frequencies of its most frequent words, turns each frequency into a z-score against the collection, and compares two texts by Manhattan distance (the sum of absolute differences). Quadratic Delta uses squared Euclidean distance. Cosine Delta uses the angle between the two z-score vectors.

They are not hunting a new champion so much as asking why these distances work. The z-score step is better than most of the alternatives they tried. How many words you keep is still a free choice, and they have no automatic rule for it. Normalizing the vector length is the reason Cosine Delta is stable: once you do that, Manhattan and Euclidean become much less sensitive to the word-count cutoff. A supervised pass that keeps only the words that actually separate authors can then pick a smaller, stabler set. On their German test, a support-vector classifier and a maximum-entropy classifier both reached 0.97 accuracy with 234 selected features.

What to keep: contrast each closed-class rate with a background (the z-score), then drop the features that do not earn their place.

## 5. Kešelj, Peng, Cercone, and Thomas on character n-grams

Vlado Kešelj, Fuchun Peng, Nick Cercone, and Calvin Thomas, "N-gram-based Author Profiles for Authorship Attribution," Pacific Association for Computational Linguistics, 2003.

- Local copy (gitignored): `papers/keselj-2003-ngram-profiles.pdf`
- https://web.cs.dal.ca/~vlado/papers/pacling03.pdf

They build an author profile without a tagger or a word list. The text is a byte string. The profile is the L most frequent byte n-grams, each with its rate. Two profiles are compared by summing, over every n-gram in either profile, the square of their rate difference divided by their average rate. The nearest profile wins. A small L is both a speed limit and a check on overfitting.

On a small English set, n-gram lengths 4–8 and profiles of about 500–3000 n-grams often scored perfectly, which they treat as fragile because the set is small. On Greek newspaper essays the best runs beat the earlier reported numbers: 85% on the more mixed set A (earlier bests were 72% and 73%) and 97% on the more uniform set B (earlier bests 70% and 89%). On Chinese the best was 0.89, below a 0.94 language-model result. They blame the byte view: Chinese characters are two bytes, so many odd-length n-grams cut a character in half.

What to keep: a character n-gram profile is a second view of the same text, and it does not need the tagger.

## 6. Baayen, van Halteren, and Tweedie on syntax

R. Harald Baayen, Hans van Halteren, and Fiona Tweedie, "Outside the Cave of Shadows: Using Syntactic Annotation to Enhance Authorship Attribution," *Literary and Linguistic Computing*, 1996. Optional, after the five above.

- Local copy (gitignored): `papers/baayen-1996-syntax.pdf`
- https://quantling.org/~hbaayen/publications/BaayenHalterenTweedie1996.pdf

Function words work, they argue, because they are a cheap trace of syntax. So count the syntax. They take crime fiction from the Nijmegen corpus, parsed with the TOSCA scheme, and use the frequencies of syntactic rewrite rules the way other studies use word frequencies. The same register matters: a pilot showed that a change of register can swamp a change of author. Inside crime fiction, rewrite-rule frequencies separated two authors more cleanly than word frequencies, and the rates vary less inside a single text. Both the common constructions and the rare ones carry author signal. Vocabulary-richness summaries catch the rough trend and misclassify more often. The cost is the parse. They are not confident a fully automatic parser will do.

What to keep: part-of-speech and construction rates are worth measuring, and a sample that mixes registers will lie about the author.
