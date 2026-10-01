import type { JSX } from "solid-js";

type Props = {
  ref?: (el: HTMLDivElement) => void;
  children: JSX.Element;
};

export default function ComposerBox(props: Props) {
  return (
    <div
      ref={props.ref}
      class="relative flex items-end gap-1 min-h-control-lg pl-3.5 pr-1.5 py-1 bg-surface border border-line rounded-md transition-colors duration-snap hover:border-ink-faint focus-within:border-accent!"
    >
      {props.children}
    </div>
  );
}
