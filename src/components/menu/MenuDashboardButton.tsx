import { LayoutDashboard } from "lucide-solid";
import { Show } from "solid-js";

type Props = {
  active: boolean;
  onClick: () => void;
};

export default function MenuDashboardButton(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      title="Dashboard"
      class={`group relative w-full flex items-center justify-center p-2 transition-colors cursor-pointer ${
        props.active ? "text-text" : "text-text-muted hover:text-text"
      } ${props.active ? "" : "hover:bg-bg"}`}
    >
      <Show when={props.active}>
        <div class="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
      </Show>
      <div
        class="size-8 rounded-lg flex items-center justify-center transition-colors"
        classList={{
          "bg-bg-light": props.active,
          "bg-bg group-hover:bg-bg-light": !props.active,
        }}
      >
        <LayoutDashboard class="size-4" />
      </div>
    </button>
  );
}
