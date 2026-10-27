import type { JSX } from "solid-js";

/// Quieter lines under the content.
export default function Detail(props: { children: JSX.Element }) {
  return (
    <div class="col-start-2 row-start-4 text-ink-soft">{props.children}</div>
  );
}
