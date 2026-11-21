export function fromKeys<K extends string, V>(
  keys: readonly K[],
  valueFor: (key: K) => V,
): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, valueFor(key)])) as Record<
    K,
    V
  >;
}
