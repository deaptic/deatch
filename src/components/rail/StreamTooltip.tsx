import { Clock, Gamepad2, Moon, Users } from "lucide-solid";
import { Show } from "solid-js";
import {
  formatUptime,
  formatViewers,
  streamGame,
  streamTitle,
} from "../../lib/format/stream.ts";
import * as clock from "../../lib/services/clock.ts";
import type { ChannelInfo, Stream, User } from "../../lib/types/index.ts";
import Stat from "../ui/Stat.tsx";
import { t } from "../../lib/i18n/index.ts";

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
          viewers: formatViewers(props.stream.viewerCount),
        })
      : "";
  const uptime = () =>
    props.stream ? formatUptime(props.stream.startedAt, clock.now()) : "";

  return (
    <div class="flex flex-col gap-2 max-w-72 px-0.5 py-0.5">
      <p class="text-body font-semibold truncate">{props.user.displayName}</p>
      <Show when={title()}>
        <p class="text-body leading-relaxed text-ink wrap-break-word line-clamp-3">
          {title()}
        </p>
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
