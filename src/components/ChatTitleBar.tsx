import { JSX, Show } from "solid-js";

type Props = {
  broadcasterName?: string;
  actions?: JSX.Element;
  sidebarCollapsed?: boolean;
  onToggleSidebar: () => void;
};

export default function ChatTitleBar(props: Props) {
  return (
    <div class="px-4 py-2 border-b border-[#2d2d35] bg-[#1f1f23] shrink-0 flex items-center justify-between relative">
      <div class="flex items-center gap-2 min-w-0">
        <button
          onClick={props.onToggleSidebar}
          title={props.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          class="w-6 h-6 flex items-center justify-center rounded text-[#5c5c7a] hover:text-white hover:bg-[#2d2d35] transition-colors cursor-pointer shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class={`w-4 h-4 transition-transform duration-150 ${props.sidebarCollapsed ? "rotate-180" : ""}`}>
            <path fill-rule="evenodd" d="M12.78 5.22a.75.75 0 010 1.06L9.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <Show when={props.broadcasterName}>
          <span class="text-white text-sm font-semibold truncate">{props.broadcasterName}</span>
        </Show>
      </div>
      <Show when={props.actions}>
        <div class="flex items-center gap-0.5 shrink-0">{props.actions}</div>
      </Show>
    </div>
  );
}
