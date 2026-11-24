import { t } from "../../../../shared/i18n/index.ts";
import type { PinnedMessage } from "../../../../shared/types/index.ts";
import Button from "../../../../kit/Button.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import { untilIso } from "./countdown.ts";

export default function PinnedRow(props: {
  pin: PinnedMessage;
  now: number;
  onJump: () => void;
  onUnpin: () => void;
}) {
  return (
    <ActivityRow
      icon={<ActivityIcon kind="pinned" />}
      title={
        <button
          type="button"
          class="max-w-full truncate text-left cursor-pointer hover:underline"
          onClick={() => props.onJump()}
        >
          <b class="font-semibold">{props.pin.sender.displayName}</b>
          {": "}
          <span class="font-normal">{props.pin.text}</span>
        </button>
      }
      meta={
        props.pin.endsAt ? untilIso(props.pin.endsAt, props.now) : undefined
      }
      actions={
        <Button variant="neutral" size="sm" onClick={() => props.onUnpin()}>
          {t("HEADER_UNPIN_LABEL")}
        </Button>
      }
    />
  );
}
