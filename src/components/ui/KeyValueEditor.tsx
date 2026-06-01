import { Check, X } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import TextInput from "./TextInput";
import Button from "./Button";

export type KeyValueEntry = { key: string; value: string };

type Props = {
  entries: KeyValueEntry[];
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  onApply: (key: string, value: string) => void | boolean | Promise<void | boolean>;
  onRemove: (key: string) => void;
};

export default function KeyValueEditor(props: Props) {
  const [keyInput, setKeyInput] = createSignal("");
  const [valueInput, setValueInput] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function apply() {
    if (busy()) return;
    const k = keyInput().trim();
    const v = valueInput().trim();
    if (!k || !v) return;
    setBusy(true);
    try {
      const ok = await props.onApply(k, v);
      if (ok !== false) {
        setKeyInput("");
        setValueInput("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="flex flex-col gap-2">
      <Show when={props.entries.length > 0}>
        <div class="flex flex-col gap-1">
          <For each={props.entries}>
            {(entry) => {
              const [draft, setDraft] = createSignal(entry.value);
              function commit(el: HTMLInputElement) {
                const v = draft().trim();
                if (!v || v === entry.value) {
                  setDraft(entry.value);
                  el.value = entry.value;
                  return;
                }
                props.onApply(entry.key, v);
              }
              return (
                <div class="flex items-center gap-2 bg-bg-light/40 border border-border rounded px-2 py-1">
                  <span class="text-text text-sm flex-1 truncate" title={entry.key}>
                    {entry.key}
                  </span>
                  <span class="text-text-muted text-xs">→</span>
                  <input
                    type="text"
                    class="flex-1 min-w-0 bg-transparent text-text text-sm outline-none cursor-text"
                    value={draft()}
                    onInput={(e) => setDraft(e.currentTarget.value)}
                    onBlur={(e) => commit(e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        setDraft(entry.value);
                        e.currentTarget.value = entry.value;
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <button
                    onClick={() => props.onRemove(entry.key)}
                    class="shrink-0 w-6 h-6 flex items-center justify-center text-text-muted hover:text-danger hover:bg-bg rounded transition-colors cursor-pointer"
                    aria-label="Remove"
                    title="Remove"
                  >
                    <X class="w-2 h-2" />
                  </button>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
      <div class="flex gap-2 items-center">
        <TextInput
          class="flex-1 min-w-0"
          placeholder={props.keyPlaceholder ?? "Key"}
          value={keyInput()}
          onInput={(e) => setKeyInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
        />
        <TextInput
          class="flex-1 min-w-0"
          placeholder={props.valuePlaceholder ?? "Value"}
          value={valueInput()}
          onInput={(e) => setValueInput(e.currentTarget.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
        />
        <Button
          onClick={apply}
          disabled={busy() || !keyInput().trim() || !valueInput().trim()}
          title="Apply"
          aria-label="Apply"
        >
          <Show
            when={!busy()}
            fallback={<div class="w-3.5 h-3.5 rounded-full border-2 border-text/30 border-t-text animate-spin" />}
          >
            <Check class="w-4 h-4" />
          </Show>
        </Button>
      </div>
    </div>
  );
}
