export function levenshteinDistance(lhs: string, rhs: string): number {
  if (lhs.length === 0) return rhs.length;
  if (rhs.length === 0) return lhs.length;

  let distance = 0;
  if (lhs[lhs.length - 1] !== rhs[rhs.length - 1]) {
    distance = 1;
  }
  return Math.min(
    levenshteinDistance(lhs.slice(0, lhs.length - 1), rhs) + 1,
    levenshteinDistance(lhs, rhs.slice(0, rhs.length - 1)) + 1,
    levenshteinDistance(
      lhs.slice(0, lhs.length - 1),
      rhs.slice(0, rhs.length - 1)
    ) + distance
  );
}
