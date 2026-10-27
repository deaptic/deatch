import type { JSX } from "solid-js";

export default function Content(props: { children: JSX.Element }) {
  return <div class="col-start-2 row-start-3 text-ink">{props.children}</div>;
}
