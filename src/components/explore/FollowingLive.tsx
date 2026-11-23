import { For, Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import { liveStreams, resolveUser } from "../../lib/stores/channels.ts";
import { exploreFilters } from "../../lib/stores/explore.ts";
import { exploreLanguage } from "../../lib/stores/preferences.ts";
import { byViewers, matchingStreams } from "../../lib/utils/liveFilter.ts";
import ChannelTile from "./ChannelTile.tsx";
import { moveGridFocus } from "../ui/gridKeys.ts";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  onSelect: (channel: User) => void;
};

export default function FollowingLive(props: Props) {
  const streams = () =>
    byViewers(
      matchingStreams(
        liveStreams(),
        exploreLanguage(),
        exploreFilters.category,
      ),
    );

  return (
    <section>
      <h2 class="mb-3 flex items-baseline gap-2 text-heading text-ink">
        {t("EXPLORE_FOLLOWING_TITLE")}
        <Show when={streams().length}>
          <span class="text-body tabular-nums text-ink-faint">
            {streams().length}
          </span>
        </Show>
      </h2>
      <Show
        when={streams().length}
        fallback={
          <p class="text-body text-ink-soft">
            {liveStreams().length
              ? t("EXPLORE_NO_MATCHES_EMPTY")
              : t("EXPLORE_NONE_LIVE_EMPTY")}
          </p>
        }
      >
        <div onKeyDown={moveGridFocus} class="-mx-2 grid grid-avatars">
          <For each={streams()}>
            {(stream) => (
              <ChannelTile
                channel={resolveUser(stream.user)}
                live
                detail={stream.game.name}
                tip={stream.title}
                onSelect={props.onSelect}
              />
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
