import { t } from "../../../shared/i18n/index.ts";
import * as activity from "../store.ts";
import { formatViewers } from "../../../shared/format/stream.ts";
import type { Poll } from "../../../shared/types/index.ts";
import Button from "../../../kit/Button.tsx";
import ActivityRow from "../ui/ActivityRow.tsx";
import { ActivityIcon } from "../ui/ActivityIcon.tsx";
import OptionBars from "../ui/OptionBars.tsx";
import { untilIso } from "./countdown.ts";

export default function PollRow(props: { broadcasterId: string; poll: Poll }) {
  return (
    <ActivityRow
      icon={<ActivityIcon kind="poll" />}
      title={props.poll.title}
      meta={t("HEADER_POLL_ENDS_IN_STATUS", {
        time: untilIso(props.poll.endsAt),
      })}
      actions={
        <Button
          variant="neutral"
          size="sm"
          onClick={() => activity.endPoll(props.broadcasterId, props.poll.id)}
        >
          {t("HEADER_END_POLL_LABEL")}
        </Button>
      }
    >
      <OptionBars
        options={props.poll.choices.map((c) => ({
          id: c.id,
          title: c.title,
          value: c.votes,
          detail: formatViewers(c.votes),
        }))}
      />
    </ActivityRow>
  );
}
