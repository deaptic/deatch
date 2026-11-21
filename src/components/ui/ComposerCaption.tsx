import type { JSX } from "solid-js";

export const CAPTION_FRAME =
  "flex items-center gap-2 pl-3.5 pr-1.5 py-1 min-h-strip material-thin rounded-lg text-small min-w-0";

export default function ComposerCaption(props: { children: JSX.Element }) {
  return (
    <div class={`mb-2 ${CAPTION_FRAME} text-ink-soft enter-rise`}>
      {props.children}
    </div>
  );
}
