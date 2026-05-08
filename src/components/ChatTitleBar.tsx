import { JSX, Show } from "solid-js";

type Props = {
  broadcasterName?: string;
  actions?: JSX.Element;
};

export default function ChatTitleBar(props: Props) {
  return (
    <div class="px-4 h-14 border-b border-[#2d2d35] bg-[#1f1f23] shrink-0 flex items-center justify-between relative">
      <Show when={props.broadcasterName}>
        <span class="text-white text-sm font-semibold truncate">{props.broadcasterName}</span>
      </Show>
      <Show when={props.actions}>
        <div class="flex items-center gap-0.5 shrink-0 ml-auto">{props.actions}</div>
      </Show>
    </div>
  );
}
