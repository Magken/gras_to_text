#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const mcp = fileURLToPath(new URL('./mcp.mjs', import.meta.url))
const result = spawnSync(process.execPath, ['--import', 'tsx', mcp], {
  stdio: 'inherit',
})
process.exit(result.status === null ? 1 : result.status)
