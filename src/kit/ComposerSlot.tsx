import type { JSX } from "solid-js";
import { composerInnerHeight } from "./rowHeight.ts";

export default function ComposerSlot(props: { children: JSX.Element }) {
  return (
    <div
      class={`flex items-center gap-1 shrink-0 self-end ${composerInnerHeight()}`}
    >
      {props.children}
    </div>
  );
}
