---
name: gras-to-text
description: >-
  Profiles a writing sample and turns it into a style sheet a chat
  model can follow, then scores a reply against that sheet. Use when
  the user wants to write in someone's style, measure prose, render a
  writing sheet, score a rewrite, clone or work in the gras_to_text
  repository, run its commands or tests, install
  @graslabs/gras_to_text, or copy this local skill into
  .cursor/skills/.
license: MIT
compatibility: Requires Node 20+ and npm. Tagged runs download an English tagger on first use.
metadata:
  author: graslabs
  npm: "@graslabs/gras_to_text"
  github: Magken/gras_to_text
---

# gras_to_text

Measure how a text is written. Turn that into a writing sheet. Score a reply against the sheet.

It does not copy length or content, and it does not judge quality. It measures closeness to one reference.

## When to use

- The user wants a style sheet from a sample (txt, md, pdf, docx, json).
- The user wants new text in that style, or a rewrite that keeps the voice.
- The user wants a reply scored with numbers, then a repair list.
- The user is inside this repository (clone or GRAS `projects/gras_to_text/`) and needs commands, tests, or an edit.
- The user wants MCP tools `profile`, `render`, and `score`.
- The user asks to install this skill for the current project.

## Install this skill locally

Cursor does not load skills from `node_modules`. If the user asks to install the skill, copy it into this workspace. Do not submit it to the Cursor marketplace. Do not add `.cursor-plugin/`.

From npm:

```text
node_modules/@graslabs/gras_to_text/skills/gras-to-text/
  -> .cursor/skills/gras-to-text/
```

Also copy to `.claude/skills/gras-to-text/` if they use Claude Code. For every project on this machine, copy to `~/.cursor/skills/gras-to-text/` only if they ask for that.

If this repository is already open, `.cursor/skills/gras-to-text/` is already here. Do not copy over it unless they ask to refresh it.

Then tell them to reload the window or start a new chat so Cursor picks it up.

## Pick a path

**Call it from another project** if they only need the functions. Install with npm. Do not clone.

**Work in this repository** if they want commands, tests, the source, or to change the package. Clone (or `cd projects/gras_to_text` inside GRAS).

Do not add the package as a lasting dependency of another monorepo unless the user asks. Do not unpublish. Do not install from GitHub Packages. Do not commit, publish, or `npm publish` unless the owner asks.

## Call it from another project

```bash
npm install @graslabs/gras_to_text
```

The published package exports TypeScript. Run consumer scripts with `npx tsx`.

```ts
import { profile, render, reportMisses, score } from '@graslabs/gras_to_text'

const sample = await profile({ path: 'essay.txt' }, { tag: true })
const sheet = render(sample)
const misses = await score(reply, sample, { tag: true })
const repairs = reportMisses(misses)
```

A string argument is the text itself. `{ path }` reads txt, md, json, pdf, or docx.

`{ tag: false }` skips the part-of-speech tagger (fast). `{ tag: true }` is required for sentence shapes and pronouns. The first tagged run downloads a model into `ts/.cache/` on a clone, or into the consumer cache.

Default mode is `generate` (new text, any subject). Pass `{ mode: 'regenerate' }` to `render` and `reportMisses` only when rewriting the sample itself.

`buildDictionary` / `addToDictionary` store words and shapes as JSON you can pass back into `profile` as `dictionary`.

## Work in this repository

### 1. Open it

```bash
git clone https://github.com/Magken/gras_to_text.git
cd gras_to_text
npm install
npm run check
```

All commands start at this folder. The wrapper `package.json` is private. `npm install` here installs `ts/` (`prepare`). Never publish the wrapper. The npm package is `ts/package.json` (`@graslabs/gras_to_text`).

Inside GRAS, `cd projects/gras_to_text` and run the same commands.

PowerShell has no `&&`. Chain with `;`. Set env with `$env:NAME='1'`. Curly quotes break inline `-e` scripts; use a `.probe-<thing>.mjs` file beside the code, then delete it.

### 2. Make a sheet, then score a reply

```bash
npm run profile -- --file PATH --out sheet.md --tag
```

Give the sheet to a writer (or write the reply yourself). Follow the sheet: take the build, not the subject, and write as long as asked.

```bash
npm run score -- --sample PATH --reply PATH --out repair.md --tag
```

With no `--out`, print to the terminal. A bare `--out name.md` writes `output/name.md`. Flags: [references/flags.md](references/flags.md).

MCP from a clone: `npm run mcp`. From npm: `npx -y @graslabs/gras_to_text`. Tools stay `profile`, `render`, `score`. To wire MCP in another project, merge `spec/mcp.example.json` into `.cursor/mcp.json` and restart MCP.

### 3. Read before you edit

Do not read every file. Do not read `tests/suite/texts/` in full.

1. `README.md` sections "From Git", "Using it", and "File structure".
2. The source file you will change and its unit in `tests/` (same folder name, same file stem: `ts/src/measures/rhythm.ts` is `tests/measures/rhythm.unit.mjs`).
3. `CONTRIBUTING.md` "Adding a measure" if you add or change a measure. "Changelog" if a user would notice the change.
4. Folder map, tests, and the measure recipe: [references/repository.md](references/repository.md).

### 4. Edit

- Failing test first. Every test has a negative case.
- Run that one unit from `ts/` while you work: `npx tsx ../tests/<folder>/<name>.unit.mjs`.
- `npm test` once at the end (a few minutes). `npm run check` for types.
- Never weaken a test. Never accept stored output (`GRAS_UPDATE_GOLDEN=1`) without reading the diff and naming why each line changed.
- Sheet: rates, not the sample's paragraph count, word count, or paragraph positions.
- Score only what the sheet showed.
- `spec/tools.json` stays `profile`, `render`, `score`.
- `semantic` and `language` stay empty.
- Do not rewrite `v1.ts` wholesale. A new approach is `v2.ts` beside it.
- No new dependency unless the owner agrees.
- Same-day row at the top of `CHANGELOG.md`. Do not rewrite old rows.
- Never start a blind round without the owner's go ahead.

### 5. Done

`npm run check` and `npm test` pass. `README.md` matches any changed command or public call. Probe files are gone. The summary says what changed, what was tested, and what is still open.

## Hard rules (every path)

- The sheet uses rates, not the sample's length. A one-paragraph request stays one paragraph.
- Do not copy content from the sample. The score flags a run of four or more words lifted from the examples.
- Keep MCP tools at `profile`, `render`, and `score`. Do not invent extra ones.
