import { t, tRich } from "../../../lib/i18n/index.ts";
import * as clock from "../../../lib/services/clock.ts";
import * as raid from "../../../lib/services/raid.ts";
import {
  type PendingRaid,
  RAID_DURATION_MS,
} from "../../../lib/stores/raid.ts";
import { knownUser } from "../../../lib/stores/users.ts";
import Button from "../../ui/Button.tsx";
import { createChannelLink } from "../../context-menus/createChannelLink.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";

export default function RaidRow(props: {
  raid: PendingRaid;
  onOpenChannel: (broadcasterId: string) => void;
}) {
  const link = createChannelLink(
    () => knownUser(props.raid.target.id),
    () => props.onOpenChannel(props.raid.target.id),
  );
  const seconds = () =>
    Math.max(
      0,
      Math.ceil(
        (RAID_DURATION_MS - (clock.now() - props.raid.startedAt)) / 1000,
      ),
    );
  return (
    <>
      <ActivityRow
        icon={<ActivityIcon kind="raid" />}
        title={tRich("HEADER_RAID_PENDING_STATUS", {
          name: props.raid.target.displayName,
          seconds: seconds(),
          target: (chunks) => (
            <b
              class={`font-semibold hover:underline ${link.cursor}`}
              {...link.handlers}
            >
              {chunks}
            </b>
          ),
          time: (chunks) => (
            <span class="font-semibold tabular-nums">{chunks}</span>
          ),
        })}
        actions={
          <Button
            variant="neutral"
            size="sm"
            onClick={() => raid.cancel().catch(() => {})}
          >
            {t("HEADER_CANCEL_RAID_LABEL")}
          </Button>
        }
      />
      {link.menu()}
    </>
  );
}
