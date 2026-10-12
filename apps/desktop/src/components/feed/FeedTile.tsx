import { type JSX, Show } from "solid-js";
import type { ChatterPresence } from "../../lib/stores/deatch.ts";

type Props = {
  color?: string;
  round?: boolean;
  presence?: ChatterPresence;
  onClick?: (x: number, y: number) => void;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

const PRESENCE: Record<ChatterPresence, { dot: string; label: string }> = {
  online: { dot: "bg-positive", label: "Online" },
  offline: { dot: "bg-ink-faint", label: "Offline" },
};

export default function FeedTile(props: Props) {
  return (
    <span
      aria-hidden="true"
      class={`relative grid size-(--chat-tile) shrink-0 select-none ${
        props.onClick ? "cursor-pointer" : ""
      }`}
      style={props.color ? { "--tile": props.color } : undefined}
      onClick={(e) => props.onClick?.(e.clientX, e.clientY)}
      onContextMenu={(e) => {
        if (!props.onContextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        props.onContextMenu(e.clientX, e.clientY);
      }}
    >
      <span
        class={`size-full grid place-items-center overflow-hidden ${
          props.round ? "rounded-full" : "rounded-sm"
        } ${props.color ? "bg-(--tile)/16 text-(--tile)" : "bg-raised"}`}
      >
        {props.children}
      </span>
      <Show when={props.presence}>
        {(presence) => (
          <span
            title={PRESENCE[presence()].label}
            class={`feed-presence absolute -bottom-px -right-px rounded-full ring-3 ring-canvas ${
              PRESENCE[presence()].dot
            }`}
          />
        )}
      </Show>
    </span>
  );
}
