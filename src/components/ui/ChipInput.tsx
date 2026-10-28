import { Plus } from "lucide-solid";
import { createSignal } from "solid-js";
import Field from "./Field.tsx";
import IconButton from "./IconButton.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  placeholder: string;
  onAdd: (value: string) => void;
};

export default function ChipInput(props: Props) {
  const [value, setValue] = createSignal("");

  function submit() {
    const v = value().trim();
    if (!v) return;
    props.onAdd(v);
    setValue("");
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
        label={t("UI_ADD")}
        variant="neutral"
        onClick={submit}
        disabled={!value().trim()}
      >
        <Plus class="size-4" />
      </IconButton>
    </div>
  );
}
