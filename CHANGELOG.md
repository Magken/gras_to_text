# Changelog

Dated notes for this package. Newest first.

## How to update this file

- Add a row the same day the change lands, at the top of the table (under the header).
- Date is `YYYY-MM-DD`. Use the day the work shipped, not the day someone remembers it.
- One row per change. Say what a reader of the package would notice: a command, a sheet line, a test gate, install, or license. Not a file list.
- Do not rewrite or delete old rows. If a later change reverses one, add a new row that says so.
- A pull request that changes behaviour, commands, or install without a row is incomplete.

| Date | Change |
|------|--------|
| 2026-09-27 | Dependabot opens weekly pull requests for npm packages in `ts/`. Alerts and security-fix PRs are on. Merge is still manual. |
| 2026-09-27 | Changelog rules: same-day row, newest first, no rewriting of old rows. |
| 2026-09-27 | Public GitHub repository: https://github.com/Magken/gras_to_text |
| 2026-09-27 | MCP server over stdio: `profile`, `render`, and `score`. Start it with `npm run mcp`. |
| 2026-09-27 | MIT license. `npm install` at the package root installs `ts/`. Research papers are cited in `research/sources.md` and are not in the repository. |
| 2026-09-27 | Commands `profile`, `score`, and `dictionary` write `output/` (or print). |
| 2026-09-27 | Style sheet and generate-mode repairs use rates, not the sample's length. Blind tests: essay passes; Austen steering is reported, not a failing gate. |
| 2026-09-26 | Version 1: `profile`, `render`, `score`, dictionary, tests, and the reading list. |
