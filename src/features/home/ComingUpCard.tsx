import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardTitle from "./CardTitle.tsx";
import ListRow from "../../kit/ListRow.tsx";
import Avatar from "../../kit/Avatar.tsx";
import Text from "../../kit/Text.tsx";
import Timestamp from "../../kit/Timestamp.tsx";
import CardEmpty from "./CardEmpty.tsx";
import { knownUser } from "../users/index.ts";
import type { ScheduledStream, User } from "../../shared/types/index.ts";

const SHOWN = 3;

type Props = {
  streams: ScheduledStream[];
  hasChannels: boolean;
  onSelect: (channel: User) => void;
};

export default function ComingUpCard(props: Props) {
  const next = () =>
    props.streams
      .flatMap((stream) => {
        const channel = knownUser(stream.broadcasterId);
        return channel ? [{ stream, channel }] : [];
      })
      .slice(0, SHOWN);

  return (
    <Card>
      <CardTitle>{t("HOME_COMING_UP_TITLE")}</CardTitle>
      <div class="flex flex-col px-1.5 pb-1.5">
        <Show
          when={next().length > 0}
          fallback={
            <CardEmpty
              body={t(
                props.hasChannels
                  ? "HOME_COMING_UP_EMPTY"
                  : "HOME_COMING_UP_NO_CHANNELS_EMPTY",
              )}
            />
          }
        >
          <For each={next()}>
            {({ stream, channel }) => (
              <ListRow onClick={() => props.onSelect(channel)}>
                <Avatar
                  src={channel.profileImageUrl}
                  alt={channel.displayName}
                  size="xs"
                />
                <div class="flex-1 min-w-0 flex flex-col">
                  <div class="flex items-baseline justify-between gap-2 min-w-0">
                    <Text tone="primary" truncate>
                      {channel.displayName}
                    </Text>
                    <Text size="xs" tone="faint" class="shrink-0">
                      <Timestamp ts={stream.start} format="n" />
                    </Text>
                  </div>
                  <Text size="sm" tone="soft" truncate>
                    {stream.title || stream.category || ""}
                  </Text>
                </div>
              </ListRow>
            )}
          </For>
        </Show>
      </div>
    </Card>
  );
}
