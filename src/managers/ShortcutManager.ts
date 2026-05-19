import { invoke } from "@tauri-apps/api/core";
import { Manager } from "./Manager";
import defaultKeymap from "../default-keymap.json";

type Handler = () => boolean | void;
type WhenFn = (ctx: Map<string, boolean>) => boolean;
type ActionEntry = { handler: Handler; when?: WhenFn };

const CHORD_TIMEOUT_MS = 1000;
const MODIFIERS = new Set(["Control", "Alt", "Shift", "Meta"]);

const DEFAULTS = new Map<string, string[]>(
  Object.entries(defaultKeymap as Record<string, string[]>),
);

function comboFor(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key.toLowerCase().replace(/^arrow/, ""));
  return parts.join("-");
}

// Tiny boolean DSL: identifiers, !, &&, ||, parens.
function compileWhen(src: string): WhenFn {
  let i = 0;
  const skip = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const consume = (s: string): boolean => {
    skip();
    if (src.startsWith(s, i)) { i += s.length; return true; }
    return false;
  };
  const parseOr = (): WhenFn => {
    let left = parseAnd();
    while (consume("||")) { const r = parseAnd(); const l = left; left = (c) => l(c) || r(c); }
    return left;
  };
  const parseAnd = (): WhenFn => {
    let left = parseNot();
    while (consume("&&")) { const r = parseNot(); const l = left; left = (c) => l(c) && r(c); }
    return left;
  };
  const parseNot = (): WhenFn => {
    if (consume("!")) { const inner = parseNot(); return (c) => !inner(c); }
    return parsePrimary();
  };
  const parsePrimary = (): WhenFn => {
    skip();
    if (consume("(")) {
      const e = parseOr();
      if (!consume(")")) throw new Error(`expected ) at ${i}`);
      return e;
    }
    const m = src.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_:.-]*/);
    if (!m) throw new Error(`expected identifier at ${i}`);
    i += m[0].length;
    return ((id) => (c) => !!c.get(id))(m[0]);
  };
  const fn = parseOr();
  skip();
  if (i < src.length) throw new Error(`trailing input at ${i}: ${src.slice(i)}`);
  return fn;
}

export class ShortcutManager extends Manager {
  private actions = new Map<string, ActionEntry>();
  private overrides = new Map<string, string[] | null>();
  private keymap = new Map<string, string[]>();
  private contexts = new Map<string, boolean>();
  private listener: ((e: KeyboardEvent) => void) | null = null;
  private pending: { seq: string; timer: number } | null = null;

  constructor() {
    super();
    this.rebuild();
  }

  public register(name: string, handler: Handler, when?: string): () => void {
    const entry: ActionEntry = { handler, when: when ? compileWhen(when) : undefined };
    this.actions.set(name, entry);
    return () => {
      if (this.actions.get(name) === entry) this.actions.delete(name);
    };
  }

  public setContext(name: string, value: boolean): void {
    this.contexts.set(name, value);
  }

  public start(): void {
    if (this.listener) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || MODIFIERS.has(e.key)) return;
      const seq = this.pending ? `${this.pending.seq} ${comboFor(e)}` : comboFor(e);
      if (this.dispatch(seq) || this.armIfPrefix(seq)) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        this.clearPending();
      }
    };
    window.addEventListener("keydown", onKey, true);
    this.listener = onKey;
    void this.load();
  }

  public stop(): void {
    if (!this.listener) return;
    window.removeEventListener("keydown", this.listener, true);
    this.listener = null;
    this.clearPending();
  }

  public rebind(combo: string, actions: string[] | null): void {
    this.overrides.set(combo, actions && actions.length > 0 ? actions : null);
    this.rebuild();
    void this.save();
  }

  private dispatch(seq: string): boolean {
    const names = this.keymap.get(seq);
    if (!names) return false;
    for (const name of names) {
      const entry = this.actions.get(name);
      if (!entry || (entry.when && !entry.when(this.contexts))) continue;
      if (entry.handler() === false) continue;
      this.clearPending();
      return true;
    }
    return false;
  }

  private armIfPrefix(seq: string): boolean {
    const prefix = `${seq} `;
    for (const k of this.keymap.keys()) {
      if (!k.startsWith(prefix)) continue;
      if (this.pending) window.clearTimeout(this.pending.timer);
      this.pending = {
        seq,
        timer: window.setTimeout(() => this.clearPending(), CHORD_TIMEOUT_MS),
      };
      return true;
    }
    return false;
  }

  private clearPending(): void {
    if (!this.pending) return;
    window.clearTimeout(this.pending.timer);
    this.pending = null;
  }

  private rebuild(): void {
    this.keymap = new Map(DEFAULTS);
    for (const [k, v] of this.overrides) {
      if (v === null) this.keymap.delete(k);
      else this.keymap.set(k, v);
    }
  }

  private async load(): Promise<void> {
    try {
      const raw = await invoke<string>("read_keymap");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string[] | null>;
      this.overrides.clear();
      for (const [combo, actions] of Object.entries(parsed)) {
        this.overrides.set(combo, actions && actions.length > 0 ? actions : null);
      }
      this.rebuild();
    } catch (e) {
      console.error("keymap load failed", e);
    }
  }

  private async save(): Promise<void> {
    const obj: Record<string, string[] | null> = {};
    for (const [k, v] of this.overrides) obj[k] = v;
    try {
      await invoke("write_keymap", { contents: JSON.stringify(obj, null, 2) });
    } catch (e) {
      console.error("keymap save failed", e);
    }
  }
}

export const shortcutManager = new ShortcutManager();
