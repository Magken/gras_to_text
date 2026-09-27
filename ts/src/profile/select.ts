/** Keep a feature whose rate or gap is not zero. */
export function selectFeatures(deviations: Record<string, number>): string[] {
  return Object.keys(deviations).filter((name) => deviations[name] !== 0)
}
