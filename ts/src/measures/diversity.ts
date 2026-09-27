/** MTLD. A stretch ends when types over tokens fall to the cutoff. */

const MTLD_CUTOFF = 0.72

export function lexicalDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0
  let factors = 0
  let count = 0
  const types = new Set<string>()
  for (const token of tokens) {
    types.add(token)
    count += 1
    if (types.size / count <= MTLD_CUTOFF) {
      factors += 1
      types.clear()
      count = 0
    }
  }
  if (count > 0) {
    const ttr = types.size / count
    factors += (1 - ttr) / (1 - MTLD_CUTOFF)
  }
  if (factors === 0) return tokens.length
  return tokens.length / factors
}
