import { createResource, For, Show } from "solid-js";
import type { User } from "../../lib/types/index.ts";
import { streamForUserId } from "../channels/index.ts";
import { recentChannels } from "../../lib/stores/preferences.ts";
import { users } from "../users/index.ts";
import ChannelTile from "./ui/ChannelTile.tsx";
import { moveGridFocus } from "../../kit/gridKeys.ts";
import { t } from "../../shared/i18n/index.ts";

type Props = {
  onSelect: (channel: User) => void;
};

export default function RecentChannels(props: Props) {
  const [channels] = createResource(
    () => [...recentChannels()],
    (ids) => users.get(ids).catch(() => []),
  );

  return (
    <Show when={channels()?.length}>
      <section>
        <h2 class="mb-3 text-heading text-ink">{t("EXPLORE_RECENT_TITLE")}</h2>
        <div onKeyDown={moveGridFocus} class="-mx-2 grid grid-avatars">
          <For each={channels()}>
            {(channel) => {
              const stream = () => streamForUserId(channel.id);
              return (
                <ChannelTile
                  channel={channel}
                  live={!!stream()}
                  detail={stream()?.game.name ?? t("EXPLORE_OFFLINE_STATUS")}
                  tip={stream()?.title}
                  onSelect={props.onSelect}
                />
              );
            }}
          </For>
        </div>
      </section>
    </Show>
  );
}
