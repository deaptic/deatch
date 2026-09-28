import type { JSX } from "solid-js";
import { copyField } from "../../lib/utils/clipboard.ts";

type Props = {
  copy: string;
  title?: string;
  icon: JSX.Element;
  children: JSX.Element;
};

export default function CopyableField(props: Props) {
  return (
    <span
      class="inline-flex items-center gap-1.5 min-w-0 text-ink-faint cursor-pointer hover:text-ink transition-colors duration-snap [&>svg]:size-3.5 [&>svg]:shrink-0"
      title={props.title ?? "Click to copy"}
      onClick={() => copyField(props.copy)}
    >
      {props.icon}
      <span class="truncate min-w-0">{props.children}</span>
    </span>
  );
}
