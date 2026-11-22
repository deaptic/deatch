import type { JSX } from "solid-js";
import { minRowHeight } from "./rowHeight.ts";

type Props = {
  ref?: (el: HTMLDivElement) => void;
  leading?: JSX.Element;
  children: JSX.Element;
};

export default function ComposerBox(props: Props) {
  return (
    <div
      ref={props.ref}
      class={`relative flex items-end gap-1 ${minRowHeight()} ${props.leading ? "pl-2.5" : "pl-3.5"} pr-2.5 py-1 bg-canvas border border-line rounded-lg transition duration-snap hover:border-ink-faint focus-within:border-accent! focus-within:ring-3 focus-within:ring-accent-soft`}
    >
      {props.leading}
      {props.children}
    </div>
  );
}
