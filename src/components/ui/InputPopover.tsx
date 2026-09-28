import { Check } from "lucide-solid";
import Field from "./Field.tsx";
import IconButton from "./IconButton.tsx";
import Popover from "./Popover.tsx";

type Props = {
  x: number;
  y: number;
  value: string;
  loading?: boolean;
  placeholder: string;
  onInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function InputPopover(props: Props) {
  return (
    <Popover x={props.x} y={props.y} onClose={props.onClose}>
      <div class="w-72 p-2 flex gap-2 items-center">
        <Field
          class="flex-1 min-w-0"
          ref={(el) => setTimeout(() => el.focus())}
          placeholder={props.placeholder}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit();
            if (e.key === "Escape") props.onClose();
          }}
        />
        <IconButton
          label="Apply"
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
