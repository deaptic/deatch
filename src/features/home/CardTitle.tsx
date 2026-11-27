import { type JSX, Show } from "solid-js";
import SectionLabel from "../../kit/SectionLabel.tsx";

type Props = {
  children: string;
  action?: JSX.Element;
  inset?: boolean;
};

export default function CardTitle(props: Props) {
  return (
    <div
      class={`flex items-center justify-between gap-3 h-11 ${
        props.inset === false ? "" : "pl-4 pr-3"
      }`}
    >
      <SectionLabel tight>{props.children}</SectionLabel>
      <Show when={props.action}>
        <div class="shrink-0">{props.action}</div>
      </Show>
    </div>
  );
}
