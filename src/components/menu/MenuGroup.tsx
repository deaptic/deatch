import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
};

export default function MenuGroup(props: Props) {
  return <div class="flex flex-col py-1">{props.children}</div>;
}
