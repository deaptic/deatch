import { chattersByChannel } from "../../lib/stores/users.ts";
import { completions } from "./usernameCompletion.ts";

type Options = {
  value: () => string;
  setValue: (v: string) => void;
  getCursor: () => number;
  setCursor: (pos: number) => void;
  broadcasterId: () => string;
};

type Cycle = {
  matches: string[];
  index: number;
  start: number;
  end: number;
};

export function createUsernameTabComplete(opts: Options) {
  let cycle: Cycle | null = null;

  function complete() {
    if (cycle) {
      cycle.index = (cycle.index + 1) % cycle.matches.length;
    } else {
      cycle = buildCycle();
    }
    if (cycle) writeCycle(cycle);
  }

  function buildCycle(): Cycle | null {
    const cursor = opts.getCursor();
    const partial = opts.value().slice(0, cursor).match(/\S+$/)?.[0];
    if (!partial) return null;
    const matches = findMatches(partial.toLowerCase());
    if (matches.length === 0) return null;
    return { matches, index: 0, start: cursor - partial.length, end: cursor };
  }

  function findMatches(query: string): string[] {
    const bucket = chattersByChannel.get(opts.broadcasterId());
    return bucket ? completions(bucket.values(), query) : [];
  }

  function writeCycle(c: Cycle) {
    const name = c.matches[c.index];
    const v = opts.value();
    opts.setValue(v.slice(0, c.start) + name + v.slice(c.end));
    c.end = c.start + name.length;
    const pos = c.end;
    queueMicrotask(() => opts.setCursor(pos));
  }

  function reset() {
    cycle = null;
  }

  return { complete, reset };
}
