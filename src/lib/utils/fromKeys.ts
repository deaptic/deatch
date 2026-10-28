/// A record holding an entry for every key.
export function fromKeys<K extends string, V>(
  keys: readonly K[],
  valueFor: (key: K) => V,
): Record<K, V> {
  // Sound: the entries cover every key.
  return Object.fromEntries(keys.map((key) => [key, valueFor(key)])) as Record<
    K,
    V
  >;
}
