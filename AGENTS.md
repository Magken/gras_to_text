# Rules for coding bots

You are editing gras_to_text, a standalone package. Read `README.md` for what it does and `CONTRIBUTING.md` for the rules. This file adds what a bot needs on top.

## Read order

1. `README.md`, sections "Install from Git", "Using it", and "File structure".
2. The source file you will change and its unit in `tests/` (same folder name, same file stem).
3. `CONTRIBUTING.md`, section "Adding a measure", if you add or change a measure. Section "Changelog" if the change is user-visible.

Do not read every file. Do not read `tests/suite/texts/` in full; the texts are long.

## Hard rules

- Write the failing test first. Every test has a negative case.
- Never weaken a test to pass: no lower threshold, no deleted assertion, no skipped case. Report the failure and why.
- Never accept the stored output (`GRAS_UPDATE_GOLDEN=1`) without reading the diff and naming why each line changed.
- The sheet never carries the sample's paragraph count, word count, or paragraph positions.
- The score only asks for what the sheet shows.
- `spec/tools.json` stays at `profile`, `render`, `score`.
- `semantic` and `language` stay empty until a design for them is agreed.
- `v1.ts` is not rewritten wholesale. A new approach is `v2.ts` beside it.
- No commits, publishing, or `npm publish` unless the owner asks.
- No new dependency unless the owner agrees.
- When behaviour, commands, or install change, add a same-day row at the top of `CHANGELOG.md`. Do not rewrite old rows.

## Save time and tokens

- Run the one unit you changed, not `npm test`, while you work: `npx tsx ../tests/profile/score.unit.mjs`. Run `npm test` once at the end. It takes a few minutes.
- `npm test` stops at the first failure. When it fails in a long test, run the remaining files in `tests/suite/` one by one to see the rest.
- Blind rounds cost about eight long stories each. Never start one without the owner's go ahead. Fix everything known first, then run one round.
- When you find a new problem while fixing another, write it down and report it. Ask before widening the task.
- Use a `.probe-<thing>.mjs` file for one off data checks and delete it when done. Quote marks and curly quotes break inline `-e` scripts in PowerShell; use a probe file instead.

## Commands

From the package root (`projects/gras_to_text/`):

| Goal | Command |
|---|---|
| Types | `npm run check` |
| All tests | `npm test` |
| Long suite only | `npm run suite` |
| Writing sheet | `npm run profile -- --file PATH --out sheet.md` |
| Repair list | `npm run score -- --sample PATH --reply PATH --out repair.md` |
| Dictionary | `npm run dictionary -- --add PATH --out voice.json` |
| MCP server (stdio) | `npm run mcp` |

From `ts/`, for one unit:

| Goal | Command |
|---|---|
| One unit | `npx tsx ../tests/<folder>/<name>.unit.mjs` |
| Accept stored output | `GRAS_UPDATE_GOLDEN=1 npx tsx ../tests/suite/essay-bot.unit.mjs` |

PowerShell has no `&&`. Chain with `;`, and set variables with `$env:NAME='1'`.

## Done means

- `npm run check` passes.
- The units you touched pass, and `npm test` passes.
- `README.md` matches any changed command, folder, or public call.
- `CHANGELOG.md` has a dated row for the change.
- Probe files are deleted.
- Your summary says what changed, what was tested, and what is still open, in plain words.
