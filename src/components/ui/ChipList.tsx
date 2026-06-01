import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
};

export default function ChipList(props: Props) {
  return <div class="flex flex-wrap gap-1">{props.children}</div>;
}
