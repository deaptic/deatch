import { Check } from "lucide-solid";
import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import Button from "./Button.tsx";

type Props = {
  x: number;
  y: number;
  value: string;
  loading?: boolean;
  placeholder?: string;
  onInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function InputPopover(props: Props) {
  return (
    <Portal>
      <div class="fixed inset-0 z-40" onClick={props.onClose} />
      <div
        style={{ position: "fixed", left: `${props.x}px`, top: `${props.y}px` }}
        class="z-50 w-64 bg-bg border border-border-muted rounded-lg shadow-2xl p-2 flex gap-2 items-center"
      >
        <input
          ref={(el) => setTimeout(() => el.focus())}
          type="text"
          placeholder={props.placeholder ?? ""}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit();
            if (e.key === "Escape") props.onClose();
          }}
          class="flex-1 min-w-0 bg-bg-light text-text text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-primary"
        />
        <Button
          onClick={props.onSubmit}
          disabled={props.loading}
          title="Apply"
          aria-label="Apply"
        >
          <Show
            when={!props.loading}
            fallback={<div class="w-3.5 h-3.5 rounded-full border-2 border-text/30 border-t-text animate-spin" />}
          >
            <Check class="w-4 h-4" />
          </Show>
        </Button>
      </div>
    </Portal>
  );
}
