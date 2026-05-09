import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
  divider?: "top" | "bottom";
};

export default function MenuSection(props: Props) {
  const border =
    props.divider === "top"
      ? "border-t border-[#2d2d35]"
      : props.divider === "bottom"
        ? "border-b border-[#2d2d35]"
        : "";
  return <div class={`flex flex-col ${border}`}>{props.children}</div>;
}
