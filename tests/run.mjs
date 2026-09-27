/** Run every unit in this folder. The suite may load the tagger. The tests stay with the project. */
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

async function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (entry.name.endsWith('.unit.mjs')) await import(pathToFileURL(full).href)
  }
}

await walk(root)
console.log('gras_to_text: units ok')
