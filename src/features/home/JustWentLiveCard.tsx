import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import ListRow from "../../kit/ListRow.tsx";
import Avatar from "../../kit/Avatar.tsx";
import Text from "../../kit/Text.tsx";
import Timestamp from "../../kit/Timestamp.tsx";
import CardEmpty from "./CardEmpty.tsx";
import { liveStreams, resolveUser } from "../channels/index.ts";
import { user } from "../users/index.ts";
import type { User } from "../../shared/types/index.ts";
import { latestLive } from "./model.ts";

type Props = {
  onSelect: (channel: User) => void;
};

export default function JustWentLiveCard(props: Props) {
  const streams = () =>
    latestLive(liveStreams().filter((s) => s.user.id !== user()?.id));

  return (
    <Card>
      <CardTitle>{t("HOME_JUST_LIVE_TITLE")}</CardTitle>
      <div class="flex flex-col px-1.5 pb-1.5">
        <Show
          when={streams().length > 0}
          fallback={<CardEmpty body={t("HOME_JUST_LIVE_EMPTY")} />}
        >
          <For each={streams()}>
            {(stream) => {
              const channel = () => resolveUser(stream.user);
              return (
                <ListRow onClick={() => props.onSelect(channel())}>
                  <Avatar
                    src={channel().profileImageUrl}
                    alt={channel().displayName}
                    size="xs"
                  />
                  <div class="flex-1 min-w-0 flex flex-col">
                    <div class="flex items-baseline justify-between gap-2 min-w-0">
                      <Text tone="primary" truncate>
                        {channel().displayName}
                      </Text>
                      <Text size="xs" tone="faint" class="shrink-0">
                        <Timestamp ts={stream.startedAt} format="R" />
                      </Text>
                    </div>
                    <Text size="sm" tone="soft" truncate>
                      {stream.game.name}
                    </Text>
                  </div>
                </ListRow>
              );
            }}
          </For>
        </Show>
      </div>
    </Card>
  );
}
