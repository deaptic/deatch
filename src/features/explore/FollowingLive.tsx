import { For, Show } from "solid-js";
import type { User } from "../../shared/types/index.ts";
import { liveStreams, resolveUser } from "../channels/index.ts";
import { filters } from "./store.ts";
import { exploreLanguage } from "../preferences/index.ts";
import { byViewers, matchingStreams } from "./model.ts";
import ChannelTile from "./ChannelTile.tsx";
import { moveGridFocus } from "../../kit/gridKeys.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  onSelect: (channel: User) => void;
};

export default function FollowingLive(props: Props) {
  const streams = () =>
    byViewers(
      matchingStreams(liveStreams(), exploreLanguage(), filters.category),
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
