import { Check } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import TextInput from "./TextInput";
import Button from "./Button";

type Props = {
  placeholder?: string;
  normalize?: (v: string) => string;
  onAdd: (value: string) => void | Promise<void>;
};

export default function ChipInput(props: Props) {
  const [value, setValue] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit() {
    if (busy()) return;
    const raw = value();
    const v = (props.normalize ?? ((s) => s.trim()))(raw);
    if (!v) return;
    setBusy(true);
    try {
      await props.onAdd(v);
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="flex gap-2 items-center">
      <TextInput
        class="flex-1 min-w-0"
        placeholder={props.placeholder}
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <Button
        onClick={submit}
        disabled={busy() || !value().trim()}
        title="Add"
        aria-label="Add"
      >
        <Show
          when={!busy()}
          fallback={
            <div class="w-3.5 h-3.5 rounded-full border-2 border-text/30 border-t-text animate-spin" />
          }
        >
          <Check class="w-4 h-4" />
        </Show>
      </Button>
    </div>
  );
}
