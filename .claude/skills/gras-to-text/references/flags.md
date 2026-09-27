# Command flags

All commands start at the repository root and forward into `ts/`.

```bash
npm run profile -- "The lamp stood in the window."
npm run profile -- --file PATH --out sheet.md --tag
npm run score -- --sample PATH --reply PATH --out repair.md --tag
npm run dictionary -- --add PATH --out voice.json
```

| Command | Writes |
|---------|--------|
| `profile` | A writing sheet from one sample |
| `score` | A repair list: a reply measured against a sample |
| `dictionary` | A JSON word and shape store |

| Flag | Meaning |
|------|---------|
| `--file PATH` | Sample for `profile` (txt, md, json, pdf, docx) |
| `--sample PATH` | Sample for `score` |
| `--reply PATH` | Text to compare |
| `--out NAME` | File to write. A bare name goes in `output/`. `.md`, `.txt`, or `.json` |
| `--json` `--md` `--txt` | Format. The `--out` extension also sets this |
| `--tag` | Part of speech tagger (shapes and pronouns) |
| `--dictionary PATH` | Use a saved dictionary while profiling |
| `--add PATH` | Text to put in a dictionary (repeatable) |
| `--in PATH` | Existing dictionary JSON to add onto |
| `--mode generate` or `--mode regenerate` | New text vs a rewrite of the sample |

`generate` (default): subject words and names are not required; copied phrases and an echoed opening are flagged first.

`regenerate`: subject words and names must stay; paragraph count is checked.
