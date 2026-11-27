import type { JSX } from "solid-js";

type Props = {
  class?: string;
  hidden?: boolean;
  truncate?: boolean;
  tight?: boolean;
  children: JSX.Element;
};

export default function SectionLabel(props: Props) {
  return (
    <span
      aria-hidden={props.hidden}
      class={`block text-xs uppercase text-ink-faint ${
        props.truncate ? "truncate whitespace-nowrap" : ""
      } ${props.tight ? "leading-none translate-y-px" : ""} ${
        props.hidden ? "opacity-0" : ""
      } ${props.class ?? ""}`}
    >
      {props.children}
    </span>
  );
}
