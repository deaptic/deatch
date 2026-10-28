import { Swords } from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";
import { type PendingRaid, RAID_DURATION_MS } from "../../lib/stores/raid.ts";
import * as raid from "../../lib/services/raid.ts";
import * as clock from "../../lib/services/clock.ts";
import { knownUser } from "../../lib/stores/users.ts";
import Button from "../ui/Button.tsx";
import { createChannelLink } from "../context-menus/createChannelLink.tsx";

type Props = {
  raid: PendingRaid;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function RaidBanner(props: Props) {
  const remaining = () =>
    Math.max(
      0,
      Math.ceil(
        (RAID_DURATION_MS - (clock.now() - props.raid.startedAt)) / 1000,
      ),
    );

  const link = createChannelLink(
    () => knownUser(props.raid.target.id),
    () => props.onOpenChannel(props.raid.target.id),
  );

  return (
    <div class="flex items-center gap-3 px-4 py-2.5 bg-raised border-b border-line-soft">
      <Swords class="size-4 shrink-0 text-event-raid" />
      <span class="min-w-0 truncate text-body text-ink">
        {t("CHAT_RAID_RAIDING")}{" "}
        <b
          class={`font-semibold hover:underline ${link.cursor}`}
          {...link.handlers}
        >
          {props.raid.target.displayName}
        </b>{" "}
        {t("CHAT_RAID_IN")}{" "}
        <span class="font-semibold tabular-nums">
          {t("CHAT_RAID_SECONDS", { seconds: remaining() })}
        </span>
      </span>
      <Button
        variant="neutral"
        size="sm"
        class="ml-auto"
        onClick={() => raid.cancel().catch(() => {})}
      >
        {t("CHAT_RAID_CANCEL")}
      </Button>
      {link.menu()}
    </div>
  );
}
