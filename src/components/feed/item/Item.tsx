import { createContext, createSignal, type JSX, Show } from "solid-js";
import type { Density } from "../../../lib/constants/density.ts";
import { openMenuAt } from "../../../lib/utils/contextMenu.ts";
import Timestamp from "../../ui/Timestamp.tsx";

export type ItemLayout = {
  density: Density;
  continued?: boolean;
  selected?: boolean;
  flush?: boolean;
  bare?: boolean;
  showTimestamp?: boolean;
};

type Props = ItemLayout & {
  id: string;
  timestamp: number;
  toneColor?: string;
  dimmed?: boolean;
  tile?: (active: () => boolean) => JSX.Element;
  overlay?: (hovered: () => boolean) => JSX.Element;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

const TINTED = {
  edge: "border-(--tone)",
  rest: "bg-(--tone)/10 hover:bg-(--tone)/14",
  selected: "bg-(--tone)/14",
};

const PLAIN = {
  edge: "border-transparent",
  rest: "hover:bg-raised",
  selected: "bg-raised",
};

export const DensityContext = createContext<() => Density>(
  (): Density => "compact",
);

export default function Item(props: Props) {
  const [hovered, setHovered] = createSignal(false);
  const active = () => hovered() || !!props.selected;
  const comfortable = () => props.density === "comfortable";

  const spacing = () =>
    !comfortable()
      ? "py-1"
      : props.continued
        ? "py-0.5"
        : "mt-(--feed-group-gap) py-0.5";

  const lead = () => (
    <Show
      when={comfortable() && props.tile}
      fallback={
        <Show when={!comfortable() && props.showTimestamp}>
          <Timestamp ts={props.timestamp} variant="column" />
        </Show>
      }
    >
      <Show
        when={!props.continued && props.tile}
        fallback={
          <span class="w-(--chat-tile) h-lh mr-3 flex items-center justify-center">
            <Show when={props.showTimestamp}>
              <Timestamp ts={props.timestamp} variant="gutter" />
            </Show>
          </span>
        }
      >
        {(tile) => (
          <span
            class={`relative block w-(--chat-tile) ${
              props.bare ? "h-(--chat-tile)" : "h-(--chat-two-lines)"
            } mr-3`}
          >
            <span class="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {tile()(active)}
            </span>
          </span>
        )}
      </Show>
    </Show>
  );

  const look = () => (props.toneColor ? TINTED : PLAIN);

  return (
    <DensityContext.Provider value={() => props.density}>
      <div
        data-item-id={props.id}
        tabIndex={-1}
        class={`relative group grid grid-cols-(--feed-columns) leading-normal wrap-break-word ${
          props.bare ? "p-2" : `pl-3 pr-2 border-l-3 ${spacing()}`
        } ${props.flush && !props.selected ? "rounded-r-md" : "rounded-md"} ${look().edge} ${
          props.selected
            ? `${look().selected} outline-3 -outline-offset-3 outline-accent`
            : `${look().rest} outline-none`
        } ${props.dimmed ? "opacity-40" : ""}`}
        style={props.toneColor ? { "--tone": props.toneColor } : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => openMenuAt(e, props.onContextMenu)}
      >
        {props.overlay?.(hovered)}
        {props.children}
        <span class="col-start-1 row-start-2 row-span-3 self-start">
          {lead()}
        </span>
      </div>
    </DensityContext.Provider>
  );
}
