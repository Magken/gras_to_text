/**
 * MCP tools are profile, render, and score. Cursor talks to mcp.mjs over stdio.
 * Run: npx tsx ../tests/mcp.unit.mjs
 */
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '../ts/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js'
import { StdioClientTransport } from '../ts/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js'
import { InMemoryTransport } from '../ts/node_modules/@modelcontextprotocol/sdk/dist/esm/inMemory.js'
import { createServer, handleTool, loadTools, startServer } from '../ts/src/mcp.ts'

const names = loadTools().map((tool) => tool.name)
assert.deepEqual(names, ['profile', 'render', 'score'])
assert.equal(typeof startServer, 'function')

const sample = 'The lamp stood in the window and nobody moved it. She counted the buses.'
const cardJson = await handleTool('profile', { text: sample })
const card = JSON.parse(cardJson)
assert.equal(Array.isArray(card.guide), true)

const sheet = await handleTool('render', { profile: card, view: 'prose' })
assert.match(sheet, /Write in this shape/)
assert.equal(sheet.includes('#'), false, 'negative: render returns the sheet, not a markdown file')

const misses = JSON.parse(await handleTool('score', { text: sample, profile: card }))
assert.equal(Array.isArray(misses), true)

await assert.rejects(() => handleTool('dictionary', { text: sample }), /unknown tool/)
await assert.rejects(() => handleTool('instructions', { text: sample }), /unknown tool/, 'negative: MCP does not expose a prompt tool')

const server = createServer()
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
const memory = new Client({ name: 'gras_to_text-test', version: '0.0.0' })
await server.connect(serverTransport)
await memory.connect(clientTransport)
const listed = await memory.listTools()
assert.deepEqual(listed.tools.map((tool) => tool.name), ['profile', 'render', 'score'])
assert.equal(
  listed.tools.some((tool) => tool.name === 'dictionary'),
  false,
  'negative: dictionary is CLI-only',
)
const rendered = await memory.callTool({ name: 'render', arguments: { profile: card, view: 'prose' } })
assert.equal(rendered.isError ?? false, false)
assert.match(rendered.content[0].text, /Write in this shape/)
await memory.close()
await server.close()

const here = dirname(fileURLToPath(import.meta.url))
const tsRoot = join(here, '../ts')
const tsxCli = join(tsRoot, 'node_modules/tsx/dist/cli.mjs')
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [tsxCli, join(tsRoot, 'mcp.mjs')],
  cwd: tsRoot,
  stderr: 'pipe',
})
const spawned = new Client({ name: 'gras_to_text-spawn', version: '0.0.0' })
await spawned.connect(transport)
const live = await spawned.listTools()
assert.deepEqual(live.tools.map((tool) => tool.name), ['profile', 'render', 'score'])
const profiled = await spawned.callTool({ name: 'profile', arguments: { text: sample } })
assert.equal(profiled.isError ?? false, false)
assert.match(profiled.content[0].text, /"guide"/)
await spawned.close()

console.log('mcp: ok')
