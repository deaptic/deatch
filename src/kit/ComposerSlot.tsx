import type { JSX } from "solid-js";
import { COMPOSER_INNER_HEIGHT } from "./density.ts";

export default function ComposerSlot(props: { children: JSX.Element }) {
  return (
    <div
      class={`flex items-center gap-1 shrink-0 self-end ${COMPOSER_INNER_HEIGHT}`}
    >
      {props.children}
    </div>
  );
}
