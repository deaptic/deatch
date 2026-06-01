import { createSignal } from "solid-js";

export type Kind = "emote" | "mention" | "command";
type Active = { kind: Kind; query: string };

type Options = {
  getValue: () => string;
  getCursor: () => number;
  setValue: (v: string) => void;
  focus: () => void;
};

export type ChatAutocompleteController = ReturnType<
  typeof createChatAutocompleteController
>;

export function createChatAutocompleteController(opts: Options) {
  const [active, setActive] = createSignal<Active | null>(null);
  const keyHandlers: Partial<Record<Kind, (e: KeyboardEvent) => boolean>> = {};

  function update(value: string, cursor: number) {
    setActive(detect(value.slice(0, cursor)));
  }

  function reset() {
    setActive(null);
  }

  function isActive() {
    return active() !== null;
  }

  function dismiss() {
    setActive(null);
    opts.focus();
  }

  function handleKey(e: KeyboardEvent): boolean {
    const a = active();
    if (!a) return false;
    return keyHandlers[a.kind]?.(e) ?? false;
  }

  function registerKeyHandler(
    kind: Kind,
    handler: (e: KeyboardEvent) => boolean,
  ) {
    keyHandlers[kind] = handler;
  }

  function unregisterKeyHandler(kind: Kind) {
    delete keyHandlers[kind];
  }

  function queryFor(kind: Kind): string | null {
    const a = active();
    return a?.kind === kind ? a.query : null;
  }

  function spliceAtTrigger(regex: RegExp, build: (match: string) => string) {
    const cursor = opts.getCursor();
    const value = opts.getValue();
    const before = value.slice(0, cursor).replace(regex, build);
    const after = value.slice(cursor);
    opts.setValue(before + after);
    opts.focus();
  }

  function clearAndSplice(regex: RegExp, build: (match: string) => string) {
    setActive(null);
    spliceAtTrigger(regex, build);
  }

  function clear() {
    setActive(null);
  }

  return {
    update,
    reset,
    isActive,
    handleKey,
    dismiss,
    queryFor,
    registerKeyHandler,
    unregisterKeyHandler,
    clearAndSplice,
    clear,
    setValue: opts.setValue,
    focus: opts.focus,
  };
}

function detect(before: string): Active | null {
  const cmd = before.match(/^\/(\w*)$/);
  if (cmd) return { kind: "command", query: cmd[1] };
  const em = before.match(/(?:^|\s):(\w+)$/);
  if (em && em[1].length >= 1) return { kind: "emote", query: em[1] };
  const mn = before.match(/(?:^|\s)@(\w*)$/);
  if (mn && mn[1].length >= 1) return { kind: "mention", query: mn[1] };
  return null;
}
