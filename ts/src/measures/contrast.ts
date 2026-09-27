/** Each rate minus a caller-supplied background mean, divided by its spread. */

export type RateBackground = Record<string, { mean: number; spread: number }>

export function zScores(
  rates: Record<string, number>,
  background: RateBackground,
): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const [feature, rate] of Object.entries(rates)) {
    const sample = background[feature]
    if (!sample) continue
    scores[feature] = sample.spread === 0 ? 0 : (rate - sample.mean) / sample.spread
  }
  return scores
}

export function contrastRates(
  rates: Record<string, number>,
  background: RateBackground,
): Record<string, number> {
  return zScores(rates, background)
}
