/**
 * gras_to_text: profile a text, render that profile, score a reply.
 * profile runs version 1 unless the caller names another version.
 * render turns a profile into text for a bot. score returns the signed gaps.
 */
import type { TextProfile } from './types/card.ts'
import type { InputFile } from './input/readInput.ts'
import { runProfile } from './versions/runProfile.ts'
import type { ProfileOptions } from './versions/v1.ts'

export type { Arrangement, DictionaryWord, FunctionWord, GuideLevel, GuideStep, RenderView, StoredDictionary, TextMiss, TextProfile, UsageDictionary, WordUse } from './types/card.ts'
export type { InputFile, InputKind, PreparedText } from './input/readInput.ts'
export type { ProfileOptions } from './versions/v1.ts'
export { readInput } from './input/readInput.ts'
export { addToDictionary, buildDictionary, dictionaryFromJson, dictionaryToJson } from './profile/dictionary.ts'
export { recommend, reportMisses } from './profile/recommend.ts'
export type { RecommendMode, RecommendOptions } from './profile/recommend.ts'
export { render } from './profile/render.ts'
export { score } from './profile/score.ts'

export function profile(input: string | InputFile, options?: ProfileOptions): Promise<TextProfile> {
  return runProfile(input, options)
}
