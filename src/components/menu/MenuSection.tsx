import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
  divider?: "top" | "bottom";
};

export default function MenuSection(props: Props) {
  const border = props.divider === "top"
    ? "border-t border-border-muted"
    : props.divider === "bottom"
    ? "border-b border-border-muted"
    : "";
  return <div class={`flex flex-col ${border}`}>{props.children}</div>;
}
