import { Plus } from "lucide-solid";
import { createSignal } from "solid-js";
import Field from "./Field.tsx";
import IconButton from "./IconButton.tsx";

type Props = {
  placeholder: string;
  onAdd: (value: string) => void | Promise<void>;
};

export default function ChipInput(props: Props) {
  const [value, setValue] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit() {
    const v = value().trim();
    if (!v || busy()) return;
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
      <Field
        class="flex-1 min-w-0"
        placeholder={props.placeholder}
        value={value()}
        onInput={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <IconButton
        label="Add"
        variant="neutral"
        onClick={submit}
        loading={busy()}
        disabled={!value().trim()}
      >
        <Plus class="size-4" />
      </IconButton>
    </div>
  );
}
