/// The item at an index the caller has already proven in range. Throws when
/// that proof is wrong, rather than letting `undefined` travel on.
export function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new RangeError(`index ${index} out of range (${items.length})`);
  }
  return item;
}
