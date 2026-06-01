import { onCleanup, onMount, Show, type JSX } from "solid-js";
import { useNavigation } from "./Navigation";

type Props = {
  label: string;
  icon?: JSX.Element;
  active: boolean;
  onClick?: () => void;
};

export default function NavigationItem(props: Props) {
  const { orientation, fill, register, unregister } = useNavigation();
  const horizontal = () => orientation() === "horizontal";

  let btnRef!: HTMLButtonElement;
  onMount(() => {
    register(btnRef, () => props.active);
    onCleanup(() => unregister(btnRef));
  });

  return (
    <button
      ref={btnRef}
      type="button"
      aria-selected={props.active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => props.onClick?.()}
      class={`group relative flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all
        ${fill() ? "flex-1" : "shrink-0"}
        ${
          horizontal()
            ? "justify-center px-6 py-3"
            : "justify-start text-left px-4 py-2.5"
        }
        ${props.active ? "text-primary" : "text-text-muted hover:text-text"}`}
    >
      <Show when={props.icon}>
        <span class="relative inline-flex shrink-0">{props.icon}</span>
      </Show>
      <span class="truncate">{props.label}</span>
    </button>
  );
}
