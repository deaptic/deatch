import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import * as clock from "../shared/clock.ts";
import { appearance } from "../features/appearance/index.ts";
import { type FeedMessage, getEntryId } from "../features/feed/index.ts";
import { users } from "../features/users/index.ts";
import {
  setAppearanceTheme,
  setFeedUserOverrideNameColor,
} from "../features/preferences/index.ts";
import {
  ChatWidget,
  type Frame,
  sampleMessages,
  sampleUsers,
  streamEntries,
  type WidgetRow,
} from "../features/widgets/index.ts";
import { ImageScale } from "../shared/solid/imageScale.ts";
import { connect } from "./socket.ts";

type StyleFrame = Extract<Frame, { topic: "style" }>;
type Assets = Omit<Extract<Frame, { topic: "assets" }>, "topic">;

const GROUP_SPACING = 8;
const THEME = "dark";
const PERCENT = 100;
const NO_ASSETS: Assets = { emotes: {}, cheermotes: {}, badges: {}, me: null };

export default function WidgetApp(props: {
  socketUrl: string;
  preview: boolean;
}) {
  const [style, setStyle] = createSignal<StyleFrame | null>(null);
  const [assets, setAssets] = createSignal<Assets>(NO_ASSETS);
  const [feed, setFeed] = createStore<{ rows: WidgetRow[] }>({ rows: [] });

  function showRows(rows: WidgetRow[]) {
    setFeed("rows", reconcile(rows, { key: "key" }));
  }

  const toRows = (entries: FeedMessage[]) =>
    entries.map((entry) => ({ key: getEntryId(entry), entry }));

  function apply(frame: Frame) {
    switch (frame.topic) {
      case "style":
        return setStyle(frame);
      case "assets":
        return setAssets(frame);
      case "entries":
        if (props.preview) return;
        users.set(frame.users);
        return showRows(toRows(frame.entries));
    }
  }

  onMount(() => {
    const stopClock = clock.start();
    const disconnect = connect(props.socketUrl, {
      frame: apply,
      closed: () => {
        if (!props.preview) showRows([]);
      },
    });
    onCleanup(() => {
      disconnect();
      stopClock();
    });
  });

  createEffect(() => {
    const frame = style();
    if (!props.preview || !frame) return;
    const { me } = assets();
    users.set(sampleUsers(me));
    showRows(
      toRows(streamEntries(sampleMessages(Date.now(), me), frame.style)),
    );
    if (frame.style.newest === "bottom") {
      requestAnimationFrame(() =>
        scrollTo(0, document.documentElement.scrollHeight),
      );
    }
  });

  onMount(() => {
    setAppearanceTheme(THEME);
    appearance.apply({ theme: THEME, accent: null, density: "spacious" });
  });

  createEffect(() => {
    const frame = style();
    if (!frame) return;
    const { scale, textSize, nameColor, textColor } = frame.style;
    appearance.applyFeedSizing({
      fontSize: textSize,
      groupSpacing: GROUP_SPACING,
    });
    const root = document.documentElement.style;
    root.setProperty("--widget-scale", String(scale / PERCENT));
    if (textColor) root.setProperty("--color-ink", textColor);
    else root.removeProperty("--color-ink");
    setFeedUserOverrideNameColor(nameColor ?? "");
  });

  return (
    <Show when={style()}>
      {(frame) => (
        <ImageScale.Provider value={() => frame().style.scale / PERCENT}>
          <ChatWidget
            chatStyle={
              props.preview ? { ...frame().style, fadeAfter: 0 } : frame().style
            }
            rows={feed.rows}
            {...assets()}
            now={clock.now()}
          />
        </ImageScale.Provider>
      )}
    </Show>
  );
}
