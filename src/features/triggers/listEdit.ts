export function replacedAt<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((current, i) => (i === index ? item : current));
}

export function removedAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}
