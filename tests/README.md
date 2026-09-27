# Tests

`npm test` from the package root runs every file named `*.unit.mjs` under this folder, including folders. `npm run suite` runs only the long suite.

## Where a test goes

| Path | What it is |
|---|---|
| `input/` | One unit per cut or reader: paragraphs, sentences, words, Markdown, PDF, Word. |
| `measures/` | One unit per count: filler words, rhythm and spoken length, tags, joins and punctuation, diversity, register, habits (`figures.unit.mjs`), z-scores, distance. |
| `hierarchy/` | Paragraph and section rollups. |
| `profile/` | The guide, the score, the feature picker, the usage dictionary and names, the sentence shapes, the paragraph lines (long sentences, closers, openers), and copied phrases. |
| `versions/` | The version 1 loop, and `guideLines.unit.mjs` for the sheet lines set against ordinary prose (glue rates, pronoun share, long-sentence length). A later version gets its own file here. |
| `suite/` | Long texts. Each case is a JSON file in `suite/cases/` and a text in `suite/texts/`. Copy `suite/cases/_template.json` to add one. Names that start with `_` are not run. `suite/essay-bot.unit.mjs` tags the essay and writes everything the bot would receive. It compares that text to `suite/expected/essay-bot.txt` and prints a line diff when they differ. Run it with `GRAS_UPDATE_GOLDEN=1` to accept a change you meant. It also scores `suite/texts/essay-repaired.txt`, a repair written from the bot text alone, which must beat the flat rewrite. `suite/heldout.unit.mjs` profiles the first half of the essay and of `suite/texts/austen.txt` and checks that each author's second half scores closer than the other author's. `suite/blind.unit.mjs` scores stories on a new subject by writers who never saw the source: one from the first sheet (`blind-with-first.txt`), one from the current sheet (`blind-with.txt`), one from a one-line brief (`blind-without.txt`). The sheet must win on style misses and Delta, and the copy check must catch what the first sheet writer lifted. `suite/blind-batch.unit.mjs` is the larger blind test: four subjects, each written from the essay sheet, from the Austen sheet, and from the brief alone, in `suite/texts/blind/`. Its gates were fixed before scoring: the sheet texts must beat the brief-only texts on mean style misses and mean Delta, win on Delta in 3 of 4 subjects, and copy at most one phrase each. Essay steering must win in 3 of 4. Austen steering is printed in the report and is not a gate. Earlier rounds sit in `blind/round1/`, `blind/round2/` and `blind/round3/`, each with the sheet its writers saw; they are not scored. `suite/distance.mjs` holds the style-miss helpers these share. |
| `card.schema.unit.mjs` | The profile shape. It sits at this level because it checks the schema, not one source folder. |
| `cli.unit.mjs` | Command flags, output paths, and writing `output/*.md`. |
| `mcp.unit.mjs` | Tools `profile`, `render`, `score`; a spawned `mcp.mjs` process lists them. |
| `package.unit.mjs` | MIT license, clone install at the package root, papers gitignored. |
| `samples.unit.mjs` | A short printed sample. The long run is `suite/`. |
| `tag.live.mjs` | Tags one sentence with the model. Not part of `npm test`. |

A unit stays next to the kind of code it proves. A new measure gets a file in `measures/`. A new long text gets a case in `suite/`, not a new loose file at this level.
