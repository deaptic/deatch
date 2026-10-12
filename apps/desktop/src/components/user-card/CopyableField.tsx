import type { JSX } from "solid-js";
import { createCopied } from "../../lib/primitives/createCopied.ts";

type Props = {
  copy: string;
  title?: string;
  icon: JSX.Element;
  truncate?: boolean;
  children: JSX.Element;
};

export default function CopyableField(props: Props) {
  const { copied, copy } = createCopied();

  return (
    <span
      class={`inline-flex items-center gap-2 h-5 cursor-pointer whitespace-nowrap transition-colors duration-snap [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-ink-faint ${
        props.truncate ? "min-w-0" : "shrink-0"
      } ${copied() ? "text-positive" : "text-ink-faint hover:text-ink"}`}
      title={props.title ?? "Click to copy"}
      onClick={() => copy(props.copy)}
    >
      {props.icon}
      <span class={props.truncate ? "truncate" : ""}>{props.children}</span>
    </span>
  );
}
