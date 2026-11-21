import type { JSX } from "solid-js";

export default function ComposerCaption(props: { children: JSX.Element }) {
  return (
    <div class="mb-1.5 flex items-center gap-2 pl-3.5 pr-1.5 py-1 material-thin rounded-md text-small text-ink-soft min-w-0 enter-rise">
      {props.children}
    </div>
  );
}
