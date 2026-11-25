import { Clock, Gamepad2, Moon, Users } from "lucide-solid";
import { Show } from "solid-js";
import {
  formatUptime,
  formatCount,
  streamGame,
  streamTitle,
} from "../../shared/format/stream.ts";
import * as clock from "../../shared/clock.ts";
import type { ChannelInfo, Stream, User } from "../../shared/types/index.ts";
import Stat from "../../kit/Stat.tsx";
import { t } from "../../shared/i18n/index.ts";
import Text from "../../kit/Text.tsx";

export default function StreamTooltip(props: {
  user: User;
  stream?: Stream;
  info?: ChannelInfo;
}) {
  const title = () => streamTitle(props.stream, props.info);
  const game = () => streamGame(props.stream, props.info);
  const viewers = () =>
    props.stream
      ? t("RAIL_VIEWERS_VALUE", {
          count: props.stream.viewerCount,
          viewers: formatCount(props.stream.viewerCount),
        })
      : "";
  const uptime = () =>
    props.stream ? formatUptime(props.stream.startedAt, clock.now()) : "";

  return (
    <div class="flex flex-col gap-2 max-w-72 px-0.5 py-0.5">
      <Text as="p" size="md" bold truncate>
        {props.user.displayName}
      </Text>
      <Show when={title()}>
        <Text as="p" size="md" tone="primary" wrap="words" clamp={3}>
          {title()}
        </Text>
      </Show>
      <div class="pt-1 flex flex-col gap-1">
        <Stat icon={<Gamepad2 />} value={game()} truncate />
        <Show
          when={props.stream}
          fallback={<Stat icon={<Moon />} value={t("RAIL_OFFLINE_STATUS")} />}
        >
          <Stat icon={<Users />} value={viewers()} />
          <Stat icon={<Clock />} value={uptime()} />
        </Show>
      </div>
    </div>
  );
}
