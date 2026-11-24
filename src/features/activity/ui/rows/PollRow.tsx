import { t } from "../../../../shared/i18n/index.ts";
import { formatCount } from "../../../../shared/format/stream.ts";
import type { Poll } from "../../../../shared/types/index.ts";
import Button from "../../../../kit/Button.tsx";
import StripRow from "../../../../kit/StripRow.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import OptionBars from "../OptionBars.tsx";
import { untilIso } from "./countdown.ts";

export default function PollRow(props: {
  poll: Poll;
  now: number;
  onEnd: () => void;
}) {
  return (
    <StripRow
      icon={<ActivityIcon kind="poll" />}
      title={props.poll.title}
      meta={t("HEADER_POLL_ENDS_IN_STATUS", {
        time: untilIso(props.poll.endsAt, props.now),
      })}
      actions={
        <Button variant="neutral" size="sm" onClick={() => props.onEnd()}>
          {t("HEADER_END_POLL_LABEL")}
        </Button>
      }
    >
      <OptionBars
        options={props.poll.choices.map((c) => ({
          id: c.id,
          title: c.title,
          value: c.votes,
          detail: formatCount(c.votes),
        }))}
      />
    </StripRow>
  );
}
