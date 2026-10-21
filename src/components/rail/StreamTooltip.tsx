import { Clock, Gamepad2, Moon, Users } from "lucide-solid";
import { Show } from "solid-js";
import { formatUptime, formatViewers } from "../../lib/format/stream.ts";
import * as clock from "../../lib/services/clock.ts";
import type { ChannelInfo, Stream, User } from "../../lib/types/index.ts";
import Stat from "../ui/Stat.tsx";
import { t } from "../../lib/i18n/index.ts";

export default function StreamTooltip(props: {
  user: User;
  stream?: Stream;
  info?: ChannelInfo;
}) {
  const title = () => props.stream?.title ?? props.info?.title ?? "";
  const game = () => props.stream?.game.name ?? props.info?.game.name ?? "";

  return (
    <div class="flex flex-col gap-2 max-w-72 px-0.5 py-0.5">
      <p class="text-body font-semibold truncate">{props.user.displayName}</p>
      <Show when={title()}>
        <p class="text-body leading-relaxed text-ink wrap-break-word line-clamp-3">
          {title()}
        </p>
      </Show>
      <div class="pt-2 border-t border-line-soft flex flex-col gap-1">
        <Stat icon={<Gamepad2 />} value={game()} truncate />
        <Show
          when={props.stream}
          fallback={<Stat icon={<Moon />} value={t("COMMON_OFFLINE")} />}
        >
          {(s) => (
            <>
              <Stat
                icon={<Users />}
                value={t("RAIL_VIEWERS", {
                  count: s().viewerCount,
                  viewers: formatViewers(s().viewerCount),
                })}
              />
              <Stat
                icon={<Clock />}
                value={formatUptime(s().startedAt, clock.now())}
              />
            </>
          )}
        </Show>
      </div>
    </div>
  );
}
