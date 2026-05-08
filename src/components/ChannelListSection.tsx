import { createSignal, JSX, Show } from "solid-js";

type Props = {
  title: string;
  count?: number;
  action?: JSX.Element;
  children?: JSX.Element;
  class?: string;
};

export default function ChannelListSection(props: Props) {
  const [collapsed, setCollapsed] = createSignal(false);

  return (
    <div class={props.class}>
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#2d2d35]">
        <button
          onClick={() => setCollapsed(c => !c)}
          class="flex items-center gap-1.5 text-[#adadb8] hover:text-white transition-colors cursor-pointer group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class={`w-3 h-3 transition-transform duration-150 ${collapsed() ? "-rotate-90" : ""}`}
          >
            <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
          </svg>
          <span class="text-xs font-semibold uppercase tracking-wider">{props.title}</span>
          <Show when={props.count !== undefined}>
            <span class="text-[#5c5c7a] text-xs font-normal normal-case tracking-normal">{props.count}</span>
          </Show>
        </button>
        {props.action}
      </div>
      <Show when={!collapsed()}>{props.children}</Show>
    </div>
  );
}
