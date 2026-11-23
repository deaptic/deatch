import { Check } from "lucide-solid";
import Field from "./Field.tsx";
import IconButton from "./IconButton.tsx";
import Popover from "./Popover.tsx";
import { autofocus } from "../../lib/reactive/focus.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  value: string;
  loading?: boolean;
  placeholder: string;
  opener?: () => HTMLElement | undefined;
  onInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function InputPopover(props: Props) {
  return (
    <Popover
      x={props.x}
      y={props.y}
      opener={props.opener}
      onClose={props.onClose}
    >
      <div class="w-72 p-2 flex gap-2 items-center">
        <Field
          class="flex-1 min-w-0"
          ref={autofocus}
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit();
          }}
        />
        <IconButton
          label={t("UI_APPLY_LABEL")}
          variant="neutral"
          onClick={props.onSubmit}
          loading={props.loading}
        >
          <Check class="size-4" />
        </IconButton>
      </div>
    </Popover>
  );
}
