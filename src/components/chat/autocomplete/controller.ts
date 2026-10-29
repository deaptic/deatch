import { createSignal } from "solid-js";
import { fieldFrom } from "../../../lib/reactive/createListbox.ts";
import type { SuggestionsApi } from "../../suggestions/Suggestions.tsx";
import { type Active, detect, type Kind } from "./detect.ts";

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
  const [lists, setLists] = createSignal<Partial<Record<Kind, SuggestionsApi>>>(
    {},
  );
  const activeList = () => {
    const a = active();
    return a ? lists()[a.kind] : undefined;
  };

  function update(value: string, cursor: number) {
    setActive(detect(value.slice(0, cursor)));
  }

  function isActive() {
    return active() !== null;
  }

  function dismiss() {
    setActive(null);
    opts.focus();
  }

  function handleKey(e: KeyboardEvent): boolean {
    return activeList()?.handleKey(e) ?? false;
  }

  function register(kind: Kind, list: SuggestionsApi) {
    setLists((prev) => ({ ...prev, [kind]: list }));
  }

  function unregister(kind: Kind) {
    setLists(({ [kind]: _, ...rest }) => rest);
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
    isActive,
    handleKey,
    dismiss,
    queryFor,
    register,
    unregister,
    field: fieldFrom(() => activeList()?.field),
    clearAndSplice,
    clear,
    setValue: opts.setValue,
    focus: opts.focus,
  };
}
