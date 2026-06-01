import { For, Show } from "solid-js";
import { badgeCategoryFor } from "../../lib/constants.ts";
import { feedBadges } from "../../lib/stores/preferences.ts";
import type { BadgeMap } from "../../lib/types/index.ts";

type Badge = { set_id: string; id: string; info?: string };

type Props = {
  badges: Badge[];
  channelBadges: BadgeMap;
  class?: string;
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
        class={`inline-flex items-center gap-1.5 bg-bg border border-border-muted rounded-md px-1.5 py-1 ${props.class ?? ""}`}
      >
        <For each={items()}>
          {(b) => (
            <img
              src={b.url}
              alt={b.title}
              title={`${b.title}${b.info ? ` (${b.info})` : ""}`}
              class="w-[0.85em] h-[0.85em]"
            />
          )}
        </For>
      </span>
    </Show>
  );
}
