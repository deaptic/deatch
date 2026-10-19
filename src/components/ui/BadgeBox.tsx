import { children, For, type JSX, Show } from "solid-js";
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
  /// Shown first, inside the same box as the badges.
  children?: JSX.Element;
};

export default function BadgeBox(props: Props) {
  const lead = children(() => props.children);
  const items = () =>
    props.badges.flatMap((b) => {
      if (feedBadges()[badgeCategoryFor(b.set_id)]?.show === false) return [];
      const badge = props.channelBadges[`${b.set_id}/${b.id}`];
      return badge ? [{ ...badge, info: b.info }] : [];
    });

  return (
    <Show when={lead() || items().length > 0}>
      <span
        class={`feed-badge-box inline-flex items-center ${
          PLACEMENTS[props.placement ?? "before"]
        }`}
      >
        {lead()}
        <For each={items()}>
          {(b) => (
            <span
              data-tip={`${b.title}${b.info ? ` (${b.info})` : ""}`}
              class="feed-badge grid place-items-center rounded-xs bg-ink/15"
            >
              <img src={b.url} alt={b.title} class="size-3/4 object-contain" />
            </span>
          )}
        </For>
      </span>
    </Show>
  );
}
