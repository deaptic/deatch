import type { JSX } from "solid-js";
import { onMiddleClick, preventAutoscroll } from "./middleClick.ts";

type Props = {
  href?: string;
  breakAll?: boolean;
  onOpen: () => void;
  children: JSX.Element;
};

export default function TextLink(props: Props) {
  return (
    <a
      href={props.href ?? "#"}
      onClick={(e) => {
        e.preventDefault();
        props.onOpen();
      }}
      onAuxClick={onMiddleClick(props.onOpen)}
      onMouseDown={preventAutoscroll}
      class={`text-accent-ink hover:underline ${props.breakAll ? "break-all" : ""}`}
    >
      {props.children}
    </a>
  );
}
