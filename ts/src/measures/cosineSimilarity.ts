/** Cosine similarity of two number lists, from -1 to 1. */

export function cosineSimilarity(
  left: Record<string, number>,
  right: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  let dot = 0
  let leftSquare = 0
  let rightSquare = 0
  for (const key of keys) {
    const a = left[key] ?? 0
    const b = right[key] ?? 0
    dot += a * b
    leftSquare += a * a
    rightSquare += b * b
  }
  if (leftSquare === 0 || rightSquare === 0) return 0
  return dot / (Math.sqrt(leftSquare) * Math.sqrt(rightSquare))
}
