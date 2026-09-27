import { copyFileSync, cpSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
copyFileSync(join(here, '../README.md'), join(here, 'README.md'))
copyFileSync(join(here, '../LICENSE'), join(here, 'LICENSE'))
cpSync(join(here, '../skills/gras-to-text'), join(here, 'skills/gras-to-text'), { recursive: true })
