/** The profile as prose for a bot, or as JSON. */

import type { RenderView, TextProfile } from '../types/card.ts'
import { recommend, type RecommendOptions } from './recommend.ts'

export function render(card: TextProfile, view: RenderView = 'prose', options: RecommendOptions = {}): string {
  if (view === 'json') return JSON.stringify(card)
  return recommend(card, options)
}
