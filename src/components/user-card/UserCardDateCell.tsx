import type { JSX } from "solid-js";
import { createCopyable } from "../ui/copyable.ts";

export default function UserCardDateCell(props: {
  icon: JSX.Element;
  title: string;
  copyable: boolean;
  children: JSX.Element;
}) {
  const copyable = createCopyable("text-ink-soft");

  return (
    <button
      type="button"
      data-tip={props.copyable ? copyable.tip(props.title) : props.title}
      disabled={!props.copyable}
      class={`flex-1 min-w-0 flex items-center gap-card-gap text-left [&>svg]:size-card-meta-icon [&>svg]:shrink-0 [&>svg]:text-ink-faint ${
        props.copyable ? copyable.class() : "text-ink-soft"
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => copyable.copy(e.currentTarget.textContent)}
    >
      {props.icon}
      <span class="truncate">{props.children}</span>
    </button>
  );
}
