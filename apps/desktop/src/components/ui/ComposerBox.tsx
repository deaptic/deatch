import type { JSX } from "solid-js";
import { minRowHeight } from "./rowHeight.ts";

type Props = {
  ref?: (el: HTMLDivElement) => void;
  children: JSX.Element;
};

export default function ComposerBox(props: Props) {
  return (
    <div
      ref={props.ref}
      class={`relative flex items-end gap-1 ${minRowHeight()} pl-3.5 pr-2.5 py-1 bg-surface border border-line rounded-md transition-colors duration-snap hover:border-ink-faint focus-within:border-accent!`}
    >
      {props.children}
    </div>
  );
}
