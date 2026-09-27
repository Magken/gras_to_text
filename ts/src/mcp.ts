/**
 * MCP entry. Registers profile, render, and score from spec/tools.json
 * and runs those public calls. Cursor starts this process and talks over stdio.
 */
import { readFileSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { profile, render, score } from './index.ts'
import type { RecommendMode } from './profile/recommend.ts'
import type { RenderView, TextProfile } from './types/card.ts'

export type GrasTool = {
  name: string
  description: string
}

export type ToolInput = Record<string, unknown>

const TOOL_NAMES = ['profile', 'render', 'score'] as const
type ToolName = (typeof TOOL_NAMES)[number]

export function loadTools(): GrasTool[] {
  const file = new URL('../../spec/tools.json', import.meta.url)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { tools: GrasTool[] }
  return parsed.tools
}

function asText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`gras_to_text: ${field} must be a string`)
  }
  return value
}

function asProfile(value: unknown): TextProfile {
  if (typeof value === 'string') return JSON.parse(value) as TextProfile
  if (value && typeof value === 'object') return value as TextProfile
  throw new Error('gras_to_text: render and score need a profile')
}

function asView(value: unknown): RenderView {
  return value === 'json' ? 'json' : 'prose'
}

function asMode(value: unknown): RecommendMode {
  return value === 'regenerate' ? 'regenerate' : 'generate'
}

export async function handleTool(name: string, input: ToolInput = {}): Promise<string> {
  const allowed = new Set(loadTools().map((tool) => tool.name))
  if (!allowed.has(name)) throw new Error(`gras_to_text: unknown tool ${name}`)
  if (name === 'profile') return JSON.stringify(await profile(asText(input.text, 'text')))
  if (name === 'render') return render(asProfile(input.profile), asView(input.view), { mode: asMode(input.mode) })
  if (name === 'score') return JSON.stringify(await score(asText(input.text, 'text'), asProfile(input.profile)))
  throw new Error(`gras_to_text: unknown tool ${name}`)
}

const schemas: Record<ToolName, Record<string, z.ZodType>> = {
  profile: { text: z.string() },
  render: {
    profile: z.union([z.string(), z.record(z.string(), z.unknown())]),
    view: z.enum(['prose', 'json']).optional(),
    mode: z.enum(['generate', 'regenerate']).optional(),
  },
  score: {
    text: z.string(),
    profile: z.union([z.string(), z.record(z.string(), z.unknown())]),
  },
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'gras_to_text', version: '0.0.0' })
  for (const tool of loadTools()) {
    if (!TOOL_NAMES.includes(tool.name as ToolName)) {
      throw new Error(`gras_to_text: no handler for ${tool.name}`)
    }
    const name = tool.name as ToolName
    server.registerTool(
      name,
      { description: tool.description, inputSchema: schemas[name] },
      async (args) => {
        try {
          const text = await handleTool(name, args as ToolInput)
          return { content: [{ type: 'text', text }] }
        } catch (error) {
          const text = error instanceof Error ? error.message : String(error)
          return { content: [{ type: 'text', text }], isError: true }
        }
      },
    )
  }
  return server
}

export async function startServer(): Promise<void> {
  const server = createServer()
  await server.connect(new StdioServerTransport())
}
