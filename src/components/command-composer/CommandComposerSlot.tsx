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
          class={`inline-flex items-center px-2 py-1 rounded-sm text-body transition-colors duration-snap cursor-pointer ${
            props.isFilled
              ? "bg-raised text-ink hover:bg-raised/80"
              : "bg-raised/30 text-ink-faint hover:bg-raised/50"
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
        class={`inline-grid items-center px-2 py-1 rounded-sm text-body bg-raised ring-1 ${
          props.errored ? "ring-negative" : "ring-accent/60"
        }`}
      >
        <span class="invisible whitespace-pre col-start-1 row-start-1 min-w-16">
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
          class="col-start-1 row-start-1 bg-transparent outline-none text-ink placeholder:text-ink-faint min-w-0 w-full"
        />
      </span>
    </Show>
  );
}
