/** npm run profile | score | dictionary */
import { runCli } from './src/cli.ts'

try {
  await runCli({ argv: process.argv.slice(2) })
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
