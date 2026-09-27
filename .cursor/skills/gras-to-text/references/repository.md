# Repository map

Load this when editing the clone, adding a measure, or choosing which test to run.

## Layout

| Path | Role |
|------|------|
| `package.json` | Private wrapper. `npm install` / `test` / `check` here. |
| `ts/` | Published TypeScript package. `src/index.ts` and `src/mcp.ts` stay at the source root. |
| `ts/src/input/` | Read files; split paragraphs, sentences, words. |
| `ts/src/measures/` | One count per file. |
| `ts/src/hierarchy/` | Roll a lower level up only when that level exists. |
| `ts/src/profile/` | Sheet, score, repair list, dictionary, shapes, copy checks. |
| `ts/src/versions/v1.ts` | Version 1 loop. Later loops sit beside it. |
| `ts/src/types/card.ts` | Types matching `spec/card.schema.json`. |
| `spec/` | Schema, `tools.json`, MCP example, fixtures. |
| `tests/` | Units mirror `ts/src/`. Long texts in `tests/suite/`. |
| `output/` | Command results. Gitignored except `.gitkeep`. |
| `CHANGELOG.md` | Dated package history. Newest first. |
| `skills/gras-to-text/` | Local Agent Skill. Copies live in `.cursor/skills/` and `.claude/skills/`. The npm tarball ships the same folder under `skills/`. |

## Commands (from the repository root)

| Goal | Command |
|------|---------|
| Types | `npm run check` |
| All tests | `npm test` |
| Long suite only | `npm run suite` |
| Writing sheet | `npm run profile -- --file PATH --out sheet.md` |
| Repair list | `npm run score -- --sample PATH --reply PATH --out repair.md` |
| Dictionary | `npm run dictionary -- --add PATH --out voice.json` |
| MCP server | `npm run mcp` |

From `ts/`, one unit: `npx tsx ../tests/<folder>/<name>.unit.mjs`.

Accept stored sheet output only after reading the diff:

```bash
$env:GRAS_UPDATE_GOLDEN='1'; npx tsx ../tests/suite/essay-bot.unit.mjs; Remove-Item Env:GRAS_UPDATE_GOLDEN
```

## What to run

| You changed | Run |
|-------------|-----|
| One function | Its unit |
| Sheet wording | `tests/versions/guideLines.unit.mjs`, then `tests/suite/essay-bot.unit.mjs` |
| Profile shape | `tests/card.schema.unit.mjs` and `npm run check` |
| Score or repair | `tests/profile/score.unit.mjs` and `tests/profile/recommend.unit.mjs` |
| CLI flags | `tests/cli.unit.mjs` |
| MCP tools | `tests/mcp.unit.mjs` |
| License, install, skill copies | `tests/package.unit.mjs` |
| Before a pull request | `npm run check` and `npm test` |

`npm test` stops at the first failure. If a long suite file failed, run the rest of `tests/suite/` one by one.

## Adding a measure

Each step lands with its test before the next starts.

1. `ts/src/measures/x.ts` and `tests/measures/x.unit.mjs`.
2. Optional field on `ts/src/types/card.ts` and `spec/card.schema.json`.
3. Sheet line in `v1.ts` only when the sample shows the feature. Negative: a sample that lacks it.
4. Score a miss only for what the sheet showed.
5. Repair with a range and a stop. Exact text plus a case that must not trigger.
6. Same threshold in `tests/suite/distance.mjs`.
7. Read the `essay-bot` diff before accepting stored output.

## Tests you must not start

Blind rounds (`tests/suite/blind*.unit.mjs`) cost long stories. Never start one without the owner. Austen steering is printed in the report; it is not a failing gate. Essay steering still must win.

Do not commit `_tmp-suite-results/`, `node_modules/`, `.probe-*.mjs`, or `ts/.cache/`.
