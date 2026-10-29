import defaultKeymap from "../../default-keymap.json" with { type: "json" };
import { comboFor, MODIFIER_KEYS } from "../utils/keyboard.ts";
import {
  compile as compileWhen,
  type Predicate as WhenFn,
} from "../utils/boolExpr.ts";

export const PASS = Symbol("pass");

type Handler = () => void | typeof PASS;

export function passUnless(handled: boolean): void | typeof PASS {
  return handled ? undefined : PASS;
}
type ActionEntry = { handler: Handler; when?: WhenFn };

const CHORD_TIMEOUT_MS = 1000;
const keymap = new Map<string, string[]>(
  Object.entries(defaultKeymap as Record<string, string[]>),
);

const actions = new Map<string, Set<ActionEntry>>();
const contexts = new Map<string, boolean>();
const localBindings = new Map<string, Set<ActionEntry>>();
let pending: { seq: string; timer: number } | null = null;

export function keyFor(action: string): string | undefined {
  for (const [combo, names] of keymap) if (names.includes(action)) return combo;
  return undefined;
}

export function register(
  name: string,
  handler: Handler,
  when?: string,
): () => void {
  return addEntry(actions, name, makeEntry(handler, when));
}

function addEntry(
  table: Map<string, Set<ActionEntry>>,
  key: string,
  entry: ActionEntry,
): () => void {
  let set = table.get(key);
  if (!set) {
    set = new Set();
    table.set(key, set);
  }
  set.add(entry);
  return () => {
    const s = table.get(key);
    if (!s) return;
    s.delete(entry);
    if (s.size === 0) table.delete(key);
  };
}

// Activate a context flag, register a batch of local bindings gated by it,
// and return one cleanup that undoes both. Intended for `onMount` →
// `onCleanup` use in components that own a set of non-rebindable shortcuts.
export function bindScope(
  context: string,
  bindings: Record<string, Handler>,
): () => void {
  setContext(context, true);
  const unregisters = Object.entries(bindings).map(([combo, handler]) =>
    registerLocal(combo, handler, context),
  );
  return () => {
    for (const u of unregisters) u();
    setContext(context, false);
  };
}

// Bind a combo directly to a handler without going through the user-rebindable
// keymap. Use for component-local shortcuts (e.g. an open picker's nav keys)
// that should never appear in user config. Locals are dispatched before the
// keymap, so they win when their `when` clause passes.
export function registerLocal(
  combo: string,
  handler: Handler,
  when?: string,
): () => void {
  return addEntry(localBindings, combo, makeEntry(handler, when));
}

export function setContext(name: string, value: boolean): void {
  contexts.set(name, value);
}

export function start(): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.isComposing || MODIFIER_KEYS.has(e.key)) return;
    const combo = comboFor(e);
    const seq = pending ? `${pending.seq} ${combo}` : combo;
    if (dispatch(seq) || armIfPrefix(seq)) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      clearPending();
    }
  };
  window.addEventListener("keydown", onKey, true);
  return () => {
    window.removeEventListener("keydown", onKey, true);
    clearPending();
  };
}

function dispatch(seq: string): boolean {
  const local = localBindings.get(seq);
  if (local && run([...local].reverse())) return true;
  const names = keymap.get(seq);
  if (!names) return false;
  return run(names.flatMap((n) => [...(actions.get(n) ?? [])].reverse()));
}

function run(entries: Iterable<ActionEntry | undefined>): boolean {
  for (const entry of entries) {
    if (!entry) continue;
    if (entry.when && !entry.when(contexts)) continue;
    if (entry.handler() === PASS) continue;
    clearPending();
    return true;
  }
  return false;
}

function armIfPrefix(seq: string): boolean {
  const prefix = `${seq} `;
  const matches = (it: Iterable<string>) => {
    for (const k of it) if (k.startsWith(prefix)) return true;
    return false;
  };
  if (!matches(keymap.keys()) && !matches(localBindings.keys())) return false;
  if (pending) window.clearTimeout(pending.timer);
  pending = {
    seq,
    timer: window.setTimeout(clearPending, CHORD_TIMEOUT_MS),
  };
  return true;
}

function clearPending(): void {
  if (!pending) return;
  window.clearTimeout(pending.timer);
  pending = null;
}

function makeEntry(handler: Handler, when?: string): ActionEntry {
  return { handler, when: when ? compileWhen(when) : undefined };
}
