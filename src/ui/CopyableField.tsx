import type { JSX } from "solid-js";
import { copyField } from "../utils/clipboard";

type Props = {
  copy?: string;
  title?: string;
  class?: string;
  icon?: JSX.Element;
  children: JSX.Element;
};

export default function CopyableField(props: Props) {
  return (
    <span
      class={`inline-flex items-center min-w-0 text-text-muted/70 ${
        props.icon ? "gap-1.5" : ""
      } ${props.copy ? "cursor-pointer hover:text-text" : ""} ${props.class ?? ""}`}
      title={props.title ?? (props.copy ? "Click to copy" : undefined)}
      onClick={() => props.copy && copyField(props.copy)}
    >
      {props.icon}
      <span class="truncate min-w-0">{props.children}</span>
    </span>
  );
}
