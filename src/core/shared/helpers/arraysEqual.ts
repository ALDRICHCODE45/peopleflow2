/**
 * Efficiently compares two arrays for equality by value.
 * More performant than JSON.stringify for array comparison.
 *
 * @param a First array to compare
 * @param b Second array to compare
 * @returns true if arrays have the same elements in the same order
 */
export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
