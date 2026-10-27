import { createContext, createSignal, type JSX, Show } from "solid-js";
import type { Density } from "../../../lib/constants/density.ts";
import { openMenuAt } from "../../../lib/utils/contextMenu.ts";
import Timestamp from "../../ui/Timestamp.tsx";

export type RowTone =
  | "held"
  | "mention"
  | "cheer"
  | "redemption"
  | "first"
  | "event"
  | "plain";

export type ItemLayout = {
  density: Density;
  continued?: boolean;
  selected?: boolean;
  flush?: boolean;
  /** p-2, no tone stripe, tile slot hugging the tile: a row in a card. */
  bare?: boolean;
  showTimestamp?: boolean;
};

type Props = ItemLayout & {
  id: string;
  timestamp: number;
  tone: RowTone;
  toneColor?: string;
  dimmed?: boolean;
  tile?: (active: () => boolean) => JSX.Element;
  overlay?: (hovered: () => boolean) => JSX.Element;
  onContextMenu?: (x: number, y: number) => void;
  children: JSX.Element;
};

const TONES: Record<RowTone, string> = {
  held: "border-caution bg-caution/12 hover:bg-caution/16",
  mention: "border-accent bg-accent-soft hover:bg-accent/18",
  cheer: "border-event-bits bg-event-bits/10 hover:bg-event-bits/14",
  redemption:
    "border-event-channel-points bg-event-channel-points/10 hover:bg-event-channel-points/14",
  first: "border-line bg-surface hover:bg-overlay",
  event: "border-(--tone) bg-(--tone)/10",
  plain: "border-transparent hover:bg-raised",
};

export const DensityContext = createContext<() => Density>(
  (): Density => "compact",
);

/// One row of the feed. Its parts sit in a two-column grid: the lead (tile
/// or timestamp) on the left, the text on the right.
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
      when={comfortable()}
      fallback={
        <Show when={props.showTimestamp}>
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

  return (
    <DensityContext.Provider value={() => props.density}>
      <div
        data-item-id={props.id}
        tabIndex={-1}
        class={`relative group grid grid-cols-(--feed-columns) leading-normal wrap-break-word ${
          props.bare ? "p-2" : `pl-3 pr-2 border-l-3 ${spacing()}`
        } outline-accent transition-colors duration-snap ${
          props.flush ? "rounded-r-sm" : "rounded-sm"
        } ${TONES[props.tone]} ${
          props.selected
            ? "outline-3 -outline-offset-3 rounded-sm"
            : "outline-none"
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
