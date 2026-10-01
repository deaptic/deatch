import { For, Show } from "solid-js";
import { badgeCategoryFor } from "../../lib/constants.ts";
import { feedBadges } from "../../lib/stores/preferences.ts";
import type { BadgeMap } from "../../lib/types/index.ts";

type Badge = { set_id: string; id: string; info?: string };

export type BadgePlacement = "before" | "after";

const PLACEMENTS: Record<BadgePlacement, string> = {
  before: "mr-1.5",
  after: "ml-1.5",
};

type Props = {
  badges: Badge[];
  channelBadges: BadgeMap;
  placement?: BadgePlacement;
};

export default function BadgeBox(props: Props) {
  const items = () =>
    props.badges.flatMap((b) => {
      if (feedBadges()[badgeCategoryFor(b.set_id)]?.show === false) return [];
      const badge = props.channelBadges[`${b.set_id}/${b.id}`];
      return badge ? [{ ...badge, info: b.info }] : [];
    });

  return (
    <Show when={items().length > 0}>
      <span
        class={`feed-badge-box inline-flex items-center ${
          PLACEMENTS[props.placement ?? "before"]
        }`}
      >
        <For each={items()}>
          {(b) => (
            <img
              src={b.url}
              alt={b.title}
              title={`${b.title}${b.info ? ` (${b.info})` : ""}`}
              class="feed-badge rounded-xs bg-ink/15"
            />
          )}
        </For>
      </span>
    </Show>
  );
}
