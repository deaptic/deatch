import type { JSX } from "solid-js";

/// Who or what the item is about, and when.
export default function Title(props: { children: JSX.Element }) {
  return <div class="col-start-2 row-start-2">{props.children}</div>;
}
