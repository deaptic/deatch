import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import CheckIcon from "../../icons/CheckIcon";

type Props = {
  x: number;
  y: number;
  value: string;
  loading: boolean;
  onInput: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function MenuAddPopover(props: Props) {
  return (
    <Portal>
      <div class="fixed inset-0 z-40" onClick={props.onClose} />
      <div
        style={{ position: "fixed", left: `${props.x}px`, top: `${props.y}px` }}
        class="z-50 w-64 bg-[#1f1f23] border border-[#2d2d35] rounded-lg shadow-2xl p-3 flex gap-2 items-center"
      >
        <input
          ref={(el) => setTimeout(() => el.focus())}
          type="text"
          placeholder="channel name"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSubmit();
            if (e.key === "Escape") props.onClose();
          }}
          class="flex-1 bg-[#2d2d35] text-white text-xs rounded px-2 py-1.5 outline-none border border-[#3d3d4a] focus:border-[#9146ff] min-w-0"
        />
        <Show
          when={!props.loading}
          fallback={<div class="w-4 h-4 rounded-full border-2 border-[#2d2d35] border-t-[#9146ff] animate-spin shrink-0" />}
        >
          <button
            onClick={props.onSubmit}
            class="text-[#9146ff] hover:text-white transition-colors cursor-pointer shrink-0"
            title="Add"
          >
            <CheckIcon class="w-4 h-4" />
          </button>
        </Show>
      </div>
    </Portal>
  );
}
