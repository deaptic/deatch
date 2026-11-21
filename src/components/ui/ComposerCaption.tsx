import type { JSX } from "solid-js";

export default function ComposerCaption(props: { children: JSX.Element }) {
  return (
    <div class="flex items-center gap-2 px-3.5 pb-1.5 text-small text-ink-soft min-w-0">
      {props.children}
    </div>
  );
}
