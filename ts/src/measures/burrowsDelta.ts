/** Sum of the absolute gaps between two z-score lists. */

export function burrowsDelta(
  left: Record<string, number>,
  right: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  let gap = 0
  for (const key of keys) gap += Math.abs((left[key] ?? 0) - (right[key] ?? 0))
  return gap
}
