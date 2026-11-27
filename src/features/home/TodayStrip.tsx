import { createMemo, createSignal, For } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import Card from "../../kit/Card.tsx";
import Donut, { type DonutTone } from "../../kit/Donut.tsx";
import Text from "../../kit/Text.tsx";
import CardTitle from "./CardTitle.tsx";
import type { User } from "../../shared/types/index.ts";
import { type Slice, slices } from "./model.ts";

export type TodayEntry = { channel: User; count: number };

export type Stat = {
  value: number;
  entries: TodayEntry[];
};

const TONES: DonutTone[] = ["chart-1", "chart-2", "chart-3", "chart-4"];

function sliceText(slice: Slice) {
  return t("HOME_SLICE_VALUE", {
    channel: slice.name ?? t("HOME_OTHER_LABEL"),
    count: formatCount(slice.count),
  });
}

function Tile(props: Stat & { label: string }) {
  const [hovered, setHovered] = createSignal<number | null>(null);
  const parts = createMemo(() =>
    slices(
      props.entries.map((entry) => ({
        name: entry.channel.displayName,
        count: entry.count,
      })),
      props.value,
    ),
  );
  const note = () => {
    const slice = parts()[hovered() ?? 0];
    return slice ? sliceText(slice) : t("HOME_NOTHING_YET_VALUE");
  };

  return (
    <Card>
      <CardTitle>{props.label}</CardTitle>
      <div class="flex items-center gap-3 px-4 pb-3">
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <Text size="xl" bold tone="primary" tabular>
            {formatCount(props.value)}
          </Text>
          <Text size="xs" tone="faint" truncate>
            {note()}
          </Text>
        </div>
        <Donut
          label={props.label}
          slices={parts().map((slice, i) => ({
            value: slice.count,
            tone: slice.name === null ? "other" : (TONES[i] ?? "other"),
          }))}
          hovered={hovered()}
          onHover={setHovered}
        />
      </div>
    </Card>
  );
}

export type StatKey = "sent" | "mentions" | "points" | "activity";

const LABELS: Record<StatKey, Parameters<typeof t>[0]> = {
  sent: "HOME_SENT_LABEL",
  mentions: "HOME_MENTIONS_LABEL",
  points: "HOME_POINTS_LABEL",
  activity: "HOME_ACTIVITY_LABEL",
};

const PAIRS: StatKey[][] = [
  ["sent", "mentions"],
  ["points", "activity"],
];

export default function TodayStrip(props: { stats: Record<StatKey, Stat> }) {
  return (
    <div class="home-cards">
      <For each={PAIRS}>
        {(pair) => (
          <div class="home-pair">
            <For each={pair}>
              {(key) => (
                <div class="home-tile">
                  <Tile label={t(LABELS[key])} {...props.stats[key]} />
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
