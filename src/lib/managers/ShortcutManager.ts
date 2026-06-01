import { Manager } from "./Manager.ts";
import defaultKeymap from "../../default-keymap.json";
import { comboFor, MODIFIER_KEYS } from "../utils/keyboard.ts";
import {
  compile as compileWhen,
  type Predicate as WhenFn,
} from "../utils/boolExpr.ts";
import { readKeymap, writeKeymap } from "../api/keymap.ts";

type Handler = () => boolean | void;
type ActionEntry = { handler: Handler; when?: WhenFn };
type Overrides = Map<string, string[] | null>;

export class ShortcutManager extends Manager {
  private static readonly CHORD_TIMEOUT_MS = 1000;
  private static readonly DEFAULTS = new Map<string, string[]>(
    Object.entries(defaultKeymap as Record<string, string[]>),
  );

  private actions = new Map<string, ActionEntry>();
  private overrides: Overrides = new Map();
  private keymap = new Map<string, string[]>();
  private contexts = new Map<string, boolean>();
  private localBindings = new Map<string, Set<ActionEntry>>();
  private listener: ((e: KeyboardEvent) => void) | null = null;
  private pending: { seq: string; timer: number } | null = null;

  constructor() {
    super();
    this.rebuild();
  }

  public register(name: string, handler: Handler, when?: string): () => void {
    const entry = this.makeEntry(handler, when);
    this.actions.set(name, entry);
    return () => {
      if (this.actions.get(name) === entry) this.actions.delete(name);
    };
  }

  // Activate a context flag, register a batch of local bindings gated by it,
  // and return one cleanup that undoes both. Intended for `onMount` →
  // `onCleanup` use in components that own a set of non-rebindable shortcuts.
  public bindScope(
    context: string,
    bindings: Record<string, Handler>,
  ): () => void {
    this.setContext(context, true);
    const unregisters = Object.entries(bindings).map(([combo, handler]) =>
      this.registerLocal(combo, handler, context)
    );
    return () => {
      for (const u of unregisters) u();
      this.setContext(context, false);
    };
  }

  // Bind a combo directly to a handler without going through the user-rebindable
  // keymap. Use for component-local shortcuts (e.g. an open picker's nav keys)
  // that should never appear in user config. Locals are dispatched before the
  // keymap, so they win when their `when` clause passes.
  public registerLocal(
    combo: string,
    handler: Handler,
    when?: string,
  ): () => void {
    const entry = this.makeEntry(handler, when);
    let set = this.localBindings.get(combo);
    if (!set) {
      set = new Set();
      this.localBindings.set(combo, set);
    }
    set.add(entry);
    return () => {
      const s = this.localBindings.get(combo);
      if (!s) return;
      s.delete(entry);
      if (s.size === 0) this.localBindings.delete(combo);
    };
  }

  public setContext(name: string, value: boolean): void {
    this.contexts.set(name, value);
  }

  public start(): void {
    if (this.listener) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || MODIFIER_KEYS.has(e.key)) return;
      const combo = comboFor(e);
      const seq = this.pending ? `${this.pending.seq} ${combo}` : combo;
      if (this.dispatch(seq) || this.armIfPrefix(seq)) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        this.clearPending();
      }
    };
    window.addEventListener("keydown", onKey, true);
    this.listener = onKey;
    void this.loadOverrides();
  }

  public stop(): void {
    if (!this.listener) return;
    window.removeEventListener("keydown", this.listener, true);
    this.listener = null;
    this.clearPending();
  }

  public rebind(combo: string, actions: string[] | null): void {
    this.overrides.set(combo, this.normalizeOverride(actions));
    this.rebuild();
    void this.saveOverrides();
  }

  private dispatch(seq: string): boolean {
    if (this.tryRun(this.localBindings.get(seq))) return true;
    const names = this.keymap.get(seq);
    if (!names) return false;
    return this.tryRun(names.map((n) => this.actions.get(n)));
  }

  private tryRun(
    entries: Iterable<ActionEntry | undefined> | undefined,
  ): boolean {
    if (!entries) return false;
    for (const entry of entries) {
      if (!entry) continue;
      if (entry.when && !entry.when(this.contexts)) continue;
      if (entry.handler() === false) continue;
      this.clearPending();
      return true;
    }
    return false;
  }

  private armIfPrefix(seq: string): boolean {
    const prefix = `${seq} `;
    const matches = (it: Iterable<string>) => {
      for (const k of it) if (k.startsWith(prefix)) return true;
      return false;
    };
    if (!matches(this.keymap.keys()) && !matches(this.localBindings.keys())) {
      return false;
    }
    if (this.pending) window.clearTimeout(this.pending.timer);
    this.pending = {
      seq,
      timer: window.setTimeout(
        () => this.clearPending(),
        ShortcutManager.CHORD_TIMEOUT_MS,
      ),
    };
    return true;
  }

  private clearPending(): void {
    if (!this.pending) return;
    window.clearTimeout(this.pending.timer);
    this.pending = null;
  }

  private rebuild(): void {
    this.keymap = new Map(ShortcutManager.DEFAULTS);
    for (const [k, v] of this.overrides) {
      if (v === null) this.keymap.delete(k);
      else this.keymap.set(k, v);
    }
  }

  private async loadOverrides(): Promise<void> {
    try {
      const raw = await readKeymap({ silent: true });
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string[] | null>;
      this.overrides.clear();
      for (const [combo, actions] of Object.entries(parsed)) {
        this.overrides.set(combo, this.normalizeOverride(actions));
      }
      this.rebuild();
    } catch {
      // best-effort: fall back to defaults
    }
  }

  private async saveOverrides(): Promise<void> {
    const obj: Record<string, string[] | null> = {};
    for (const [k, v] of this.overrides) obj[k] = v;
    await writeKeymap({ contents: JSON.stringify(obj, null, 2) });
  }

  private makeEntry(handler: Handler, when?: string): ActionEntry {
    return { handler, when: when ? compileWhen(when) : undefined };
  }

  private normalizeOverride(
    actions: string[] | null | undefined,
  ): string[] | null {
    return actions && actions.length > 0 ? actions : null;
  }
}

export const shortcutManager = new ShortcutManager();
