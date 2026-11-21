import type { Chatter } from "../types/index.ts";

const MAX_PER_CHANNEL = 1000;
const PRUNE_SLACK = 200;

export function recordIn(bucket: Map<string, Chatter>, chatter: Chatter): void {
  const existing = bucket.get(chatter.id);
  if (existing && existing.lastSeen >= chatter.lastSeen) return;
  bucket.set(chatter.id, chatter);
  if (bucket.size <= MAX_PER_CHANNEL + PRUNE_SLACK) return;
  const recent = [...bucket.values()]
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, MAX_PER_CHANNEL);
  bucket.clear();
  for (const c of recent) bucket.set(c.id, c);
}
