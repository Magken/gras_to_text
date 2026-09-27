/**
 * Command line for profile, score, and dictionary.
 * Writes a txt, md, or json file under output/, or prints when --out is omitted.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  addToDictionary,
  buildDictionary,
  dictionaryFromJson,
  profile,
  reportMisses,
  render,
  score,
} from './index.ts'
import type { RecommendMode } from './profile/recommend.ts'
import type { StoredDictionary } from './types/card.ts'

export type CliFormat = 'md' | 'txt' | 'json'
export type CliCommand = 'profile' | 'score' | 'dictionary'

export type CliArgs = {
  command: CliCommand
  file?: string
  text?: string
  out?: string
  format: CliFormat
  tag: boolean
  sample?: string
  reply?: string
  dictionary?: string
  in?: string
  add: string[]
  mode: RecommendMode
}

export type CliRun = {
  argv: string[]
  cwd?: string
  outputDir?: string
  log?: (line: string) => void
}

const COMMANDS = new Set<CliCommand>(['profile', 'score', 'dictionary'])
const FORMATS: Record<string, CliFormat> = { '.md': 'md', '.txt': 'txt', '.json': 'json' }

const packageRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..')
export const defaultOutputDir = join(packageRoot, 'output')

function take(argv: string[], index: number, flag: string): string {
  const value = argv[index]
  if (!value || value.startsWith('--')) throw new Error(`gras_to_text: ${flag} needs a value`)
  return value
}

function formatOf(out: string | undefined, flags: { json?: boolean; md?: boolean; txt?: boolean }, command: CliCommand): CliFormat {
  const picked = [flags.json && 'json', flags.md && 'md', flags.txt && 'txt'].filter(Boolean) as CliFormat[]
  if (picked.length > 1) throw new Error('gras_to_text: pass one format (--json, --md, or --txt)')
  if (picked[0]) return picked[0]
  const fromPath = out ? FORMATS[extname(out).toLowerCase()] : undefined
  if (fromPath) return fromPath
  return command === 'dictionary' ? 'json' : 'md'
}

export function parseArgs(argv: string[]): CliArgs {
  const [head, ...rest] = argv
  if (!head || !COMMANDS.has(head as CliCommand)) {
    throw new Error('gras_to_text: start with profile, score, or dictionary')
  }
  const command = head as CliCommand
  const flags: { json?: boolean; md?: boolean; txt?: boolean } = {}
  const add: string[] = []
  let file: string | undefined
  let out: string | undefined
  let sample: string | undefined
  let reply: string | undefined
  let dictionary: string | undefined
  let from: string | undefined
  let mode: RecommendMode = 'generate'
  let tag = false
  const words: string[] = []

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i]
    if (token === '--json') flags.json = true
    else if (token === '--md') flags.md = true
    else if (token === '--txt') flags.txt = true
    else if (token === '--tag') tag = true
    else if (token === '--no-tag') tag = false
    else if (token === '--file') file = take(rest, ++i, '--file')
    else if (token === '--out') out = take(rest, ++i, '--out')
    else if (token === '--sample') sample = take(rest, ++i, '--sample')
    else if (token === '--reply') reply = take(rest, ++i, '--reply')
    else if (token === '--dictionary') dictionary = take(rest, ++i, '--dictionary')
    else if (token === '--in') from = take(rest, ++i, '--in')
    else if (token === '--add') add.push(take(rest, ++i, '--add'))
    else if (token === '--mode') {
      const value = take(rest, ++i, '--mode')
      if (value !== 'generate' && value !== 'regenerate') throw new Error('gras_to_text: --mode is generate or regenerate')
      mode = value
    } else if (token.startsWith('--')) {
      throw new Error(`gras_to_text: unknown flag ${token}`)
    } else {
      words.push(token)
    }
  }

  const text = words.join(' ').trim() || undefined
  const format = formatOf(out, flags, command)
  if (command === 'profile' && !file && !text) throw new Error('gras_to_text: pass --file or the text after profile')
  if (command === 'score' && !sample) throw new Error('gras_to_text: score needs --sample')
  if (command === 'score' && !reply) throw new Error('gras_to_text: score needs --reply')
  if (command === 'dictionary' && add.length === 0) throw new Error('gras_to_text: dictionary needs --add')
  if (command === 'dictionary' && format !== 'json') throw new Error('gras_to_text: a dictionary is json')

  return { command, file, text, out, format, tag, sample, reply, dictionary, in: from, add, mode }
}

export function resolveOut(out: string, outputDir: string, cwd: string): string {
  const ext = extname(out).toLowerCase()
  if (!FORMATS[ext]) throw new Error('gras_to_text: --out must end in .txt, .md, or .json')
  if (isAbsolute(out)) return out
  if (dirname(out) === '.') return join(outputDir, basename(out))
  return resolve(cwd, out)
}

const TITLES: Record<CliCommand, string> = {
  profile: 'Writing sheet',
  score: 'Repair list',
  dictionary: 'Dictionary',
}

export function formatBody(body: string, format: CliFormat, command: CliCommand): string {
  const trimmed = body.endsWith('\n') ? body : `${body}\n`
  if (format === 'md') return `# ${TITLES[command]}\n\n${trimmed}`
  return trimmed
}

function inputOf(path?: string, text?: string) {
  return path ? { path } : text ?? ''
}

async function loadDictionary(path: string | undefined): Promise<StoredDictionary | undefined> {
  if (!path) return undefined
  return dictionaryFromJson(readFileSync(path, 'utf8'))
}

async function bodyFor(args: CliArgs): Promise<string> {
  const options = { tag: args.tag, ...(args.dictionary ? { dictionary: await loadDictionary(args.dictionary) } : {}) }
  if (args.command === 'profile') {
    const card = await profile(inputOf(args.file, args.text), options)
    return args.format === 'json' ? JSON.stringify(card, null, 2) : render(card, 'prose', { mode: args.mode })
  }
  if (args.command === 'score') {
    const card = await profile(inputOf(args.sample), options)
    const misses = await score(inputOf(args.reply), card, { tag: args.tag })
    return args.format === 'json' ? JSON.stringify(misses, null, 2) : reportMisses(misses, { mode: args.mode })
  }
  let stored = args.in ? await loadDictionary(args.in) : undefined
  for (const file of args.add) {
    stored = stored
      ? await addToDictionary(stored, { path: file }, { tag: args.tag })
      : await buildDictionary({ path: file }, { tag: args.tag })
  }
  return JSON.stringify(stored ?? {}, null, 2)
}

export async function runCli(run: CliRun): Promise<{ path?: string; text: string }> {
  const args = parseArgs(run.argv)
  const cwd = run.cwd ?? process.cwd()
  const outputDir = run.outputDir ?? defaultOutputDir
  const log = run.log ?? console.log
  const raw = await bodyFor(args)
  const text = args.out
    ? formatBody(raw, args.format, args.command)
    : args.format === 'json'
      ? formatBody(raw, 'json', args.command)
      : (raw.endsWith('\n') ? raw : `${raw}\n`)
  if (!args.out) {
    log(text.trimEnd())
    return { text }
  }
  const path = resolveOut(args.out, outputDir, cwd)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text, 'utf8')
  log(`wrote ${path}`)
  return { path, text }
}
