import type { JSX } from "solid-js";

type Props = {
  danger?: boolean;
  children: JSX.Element;
};

export default function Banner(props: Props) {
  return (
    <div
      class={`flex items-center gap-3 px-4 py-2.5 border-b border-line-soft text-small text-ink-soft ${
        props.danger ? "bg-negative/10" : "bg-raised"
      }`}
    >
      <span class="truncate min-w-0">{props.children}</span>
    </div>
  );
}
