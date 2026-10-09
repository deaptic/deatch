import defaultKeymap from "../../default-keymap.json" with { type: "json" };
import { comboFor, MODIFIER_KEYS } from "../utils/keyboard.ts";
import {
  compile as compileWhen,
  type Predicate as WhenFn,
} from "../utils/boolExpr.ts";
import { readKeymap } from "../api/keymap.ts";

type Handler = () => boolean | void;
type ActionEntry = { handler: Handler; when?: WhenFn };
type Overrides = Map<string, string[] | null>;

const CHORD_TIMEOUT_MS = 1000;
const DEFAULTS = new Map<string, string[]>(
  Object.entries(defaultKeymap as Record<string, string[]>),
);

const actions = new Map<string, ActionEntry>();
const overrides: Overrides = new Map();
const contexts = new Map<string, boolean>();
const localBindings = new Map<string, Set<ActionEntry>>();
let keymap = new Map(DEFAULTS);
let pending: { seq: string; timer: number } | null = null;

export function register(
  name: string,
  handler: Handler,
  when?: string,
): () => void {
  const entry = makeEntry(handler, when);
  actions.set(name, entry);
  return () => {
    if (actions.get(name) === entry) actions.delete(name);
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
    registerLocal(combo, handler, context)
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
  const entry = makeEntry(handler, when);
  let set = localBindings.get(combo);
  if (!set) {
    set = new Set();
    localBindings.set(combo, set);
  }
  set.add(entry);
  return () => {
    const s = localBindings.get(combo);
    if (!s) return;
    s.delete(entry);
    if (s.size === 0) localBindings.delete(combo);
  };
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
  void loadOverrides();
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
  return run(names.map((n) => actions.get(n)));
}

function run(entries: Iterable<ActionEntry | undefined> | undefined): boolean {
  if (!entries) return false;
  for (const entry of entries) {
    if (!entry) continue;
    if (entry.when && !entry.when(contexts)) continue;
    if (entry.handler() === false) continue;
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

function rebuild(): void {
  keymap = new Map(DEFAULTS);
  for (const [k, v] of overrides) {
    if (v === null) keymap.delete(k);
    else keymap.set(k, v);
  }
}

async function loadOverrides(): Promise<void> {
  try {
    const raw = await readKeymap({ silent: true });
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string[] | null>;
    overrides.clear();
    for (const [combo, bound] of Object.entries(parsed)) {
      overrides.set(combo, normalizeOverride(bound));
    }
    rebuild();
  } catch (e) {
    console.warn("keymap.json unreadable, using default shortcuts", e);
  }
}

function makeEntry(handler: Handler, when?: string): ActionEntry {
  return { handler, when: when ? compileWhen(when) : undefined };
}

function normalizeOverride(
  bound: string[] | null | undefined,
): string[] | null {
  return bound && bound.length > 0 ? bound : null;
}
