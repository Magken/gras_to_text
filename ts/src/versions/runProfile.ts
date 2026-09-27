/** The main loops. Version 1 is the default. A later version is a new file in this folder. */

import { profileV1, type ProfileOptions } from './v1.ts'
import type { InputFile } from '../input/readInput.ts'
import type { TextProfile } from '../types/card.ts'

const loops: Record<number, (input: string | InputFile, options?: ProfileOptions) => Promise<TextProfile>> = {
  1: profileV1,
}

export async function runProfile(
  input: string | InputFile,
  options: ProfileOptions = {},
): Promise<TextProfile> {
  const version = options.version ?? 1
  const loop = loops[version]
  if (!loop) throw new Error(`gras_to_text: profile version ${version} is not implemented`)
  return loop(input, options)
}
