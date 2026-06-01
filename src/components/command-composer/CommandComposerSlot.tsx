import { Show } from "solid-js";
import type { CommandOption } from "./types.ts";

type Props = {
  option: CommandOption;
  raw: string;
  displayLabel: string;
  isActive: boolean;
  isFilled: boolean;
  errored: boolean;
  onActivate: () => void;
  inputRef?: (el: HTMLInputElement) => void;
  onInput?: (e: InputEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export default function CommandComposerSlot(props: Props) {
  return (
    <Show
      when={props.isActive}
      fallback={
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            props.onActivate();
          }}
          class={`inline-flex items-center px-2 py-1 rounded text-base transition-colors cursor-pointer ${
            props.isFilled
              ? "bg-bg-light text-text hover:bg-bg-light/80"
              : "bg-bg-light/30 text-text-muted/70 hover:bg-bg-light/50"
          }`}
        >
          {props.isFilled
            ? props.displayLabel
            : `${props.option.name}${
              props.option.required === false ? "?" : ""
            }`}
        </button>
      }
    >
      <span
        class={`inline-grid items-center px-2 py-1 rounded text-base bg-bg-light ring-1 ${
          props.errored ? "ring-danger" : "ring-primary/60"
        }`}
      >
        <span class="invisible whitespace-pre col-start-1 row-start-1 min-w-[6ch]">
          {props.raw || props.option.name}
        </span>
        <input
          ref={props.inputRef}
          value={props.raw}
          onInput={props.onInput}
          onKeyDown={props.onKeyDown}
          placeholder={props.option.name}
          autocomplete="off"
          spellcheck={false}
          class="col-start-1 row-start-1 bg-transparent outline-none text-text placeholder-text-muted/60 min-w-0 w-full"
        />
      </span>
    </Show>
  );
}
