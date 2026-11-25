import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import type { CheermoteMap, EmoteMap } from "../emotes/index.ts";
import { type BadgeMap, type FeedMessage, FeedRow } from "../feed/index.ts";
import type { ChatStyle } from "../preferences/index.ts";
import { appearance } from "../appearance/index.ts";
import { glide, measure, type Motion, type Spot } from "./glide.ts";
import { isExpired, withLeaving } from "./model.ts";

export type Row = { key: string; entry: FeedMessage };

type Props = {
  chatStyle: ChatStyle;
  rows: Row[];
  emotes: EmoteMap;
  cheermotes: CheermoteMap;
  badges: BadgeMap;
  now: number;
};

const SECOND_MS = 1_000;

type Flow = "up" | "down" | "fill";

const FLOWS: Record<Flow, string> = {
  up: "flex-col justify-end",
  down: "flex-col-reverse justify-end",
  fill: "flex-col justify-end *:last:mb-auto",
};

const sameKeys = (a: Row[], b: Row[]) =>
  a.length === b.length && a.every((row, i) => row === b[i]);

function motion(): Motion {
  return {
    duration: parseFloat(appearance.token("duration-quick")),
    easing: appearance.token("ease-out"),
  };
}

export default function ChatWidget(props: Props) {
  const elements = new Map<string, HTMLElement>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const [rendered, setRendered] = createSignal<Row[]>([]);
  const [leaving, setLeaving] = createSignal<ReadonlyMap<string, Spot>>(
    new Map(),
  );

  const visible = createMemo(
    () =>
      props.rows.filter(
        (row) =>
          !isExpired(
            props.now - row.entry.timestamp,
            props.chatStyle.fadeAfter * SECOND_MS,
          ),
      ),
    [],
    { equals: sameKeys },
  );

  function drop(key: string) {
    batch(() => {
      setRendered((rows) => rows.filter((row) => row.key !== key));
      setLeaving((spots) => {
        const next = new Map(spots);
        next.delete(key);
        return next;
      });
    });
  }

  createEffect(
    on(visible, (rows) => {
      const before = measure(elements);
      const spots = new Map(untrack(leaving));
      const merged = withLeaving(
        untrack(rendered).map((row) => ({ row, leaving: spots.has(row.key) })),
        rows,
      ).filter(({ row, leaving: going }) => {
        if (!going || spots.has(row.key)) return true;
        const spot = before.get(row.key);
        if (!spot) return false;
        spots.set(row.key, spot);
        const timer = setTimeout(
          () => {
            timers.delete(timer);
            drop(row.key);
          },
          parseFloat(appearance.token("duration-settle")),
        );
        timers.add(timer);
        return true;
      });
      batch(() => {
        setRendered(merged.map(({ row }) => row));
        setLeaving(spots);
      });
      const going = new Set(spots.keys());
      queueMicrotask(() => glide(elements, before, going, motion()));
    }),
  );

  onCleanup(() => {
    for (const timer of timers) clearTimeout(timer);
  });

  const flow = (): Flow => {
    if (props.chatStyle.newest === "top") return "down";
    return props.chatStyle.fill === "top" ? "fill" : "up";
  };

  return (
    <div
      class={`relative flex gap-(--widget-gap) h-full overflow-hidden p-(--widget-edge) text-(length:--chat-size) text-shadow-overlay ${
        FLOWS[flow()]
      } ${props.chatStyle.align === "right" ? "items-end" : "items-start"}`}
      data-names={props.chatStyle.boldNames ? undefined : "regular"}
      style={{
        "--tile-alpha": `${props.chatStyle.backgroundOpacity}%`,
        "--tile-color":
          props.chatStyle.backgroundColor ?? "var(--color-canvas)",
        "--tile-radius": `${props.chatStyle.radius}px`,
        "--tile-width":
          props.chatStyle.width === "full" ? "100%" : "fit-content",
        "--widget-edge": `${props.chatStyle.edge}px`,
        "--widget-gap": `${props.chatStyle.gap}px`,
        "--flow": flow() === "down" ? "-1" : "1",
      }}
    >
      <For each={rendered()}>
        {(row) => {
          const spot = () => leaving().get(row.key);
          onCleanup(() => elements.delete(row.key));
          return (
            <div
              ref={(el) => elements.set(row.key, el)}
              class={`max-w-full enter-rise ${
                spot()
                  ? "absolute top-(--leave-top) left-(--leave-left) w-(--leave-width)"
                  : "w-(--tile-width)"
              }`}
              style={
                spot()
                  ? {
                      "--leave-top": `${spot()?.top}px`,
                      "--leave-left": `${spot()?.left}px`,
                      "--leave-width": `${spot()?.width}px`,
                    }
                  : undefined
              }
              data-leaving={spot() ? "" : undefined}
            >
              <FeedRow
                entry={row.entry}
                density={props.chatStyle.density}
                tiled
                showTimestamp={props.chatStyle.showTimestamp}
                showBadges={props.chatStyle.showBadges}
                showToolbar={false}
                highlightMentions={false}
                showAvatars={props.chatStyle.showAvatars}
                linkPreviews={false}
                emotes={props.emotes}
                cheermotes={props.cheermotes}
                badges={props.badges}
                userLogin=""
                reactions={[]}
              />
            </div>
          );
        }}
      </For>
    </div>
  );
}
