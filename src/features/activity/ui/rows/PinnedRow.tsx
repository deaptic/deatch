import { t } from "../../../../shared/i18n/index.ts";
import Button from "../../../../kit/Button.tsx";
import type { JSX } from "solid-js";
import StripRow from "../../../../kit/StripRow.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import { untilIso } from "./countdown.ts";

export default function PinnedRow(props: {
  sender: string;
  text: JSX.Element;
  endsAt: string | null;
  now: number;
  onJump: () => void;
  onUnpin: () => void;
}) {
  return (
    <StripRow
      icon={<ActivityIcon kind="pinned" />}
      title={
        <button
          type="button"
          class="max-w-full truncate text-left cursor-pointer hover:underline"
          onClick={() => props.onJump()}
        >
          <b class="font-semibold">{props.sender}</b>
          {": "}
          <span class="font-normal">{props.text}</span>
        </button>
      }
      meta={props.endsAt ? untilIso(props.endsAt, props.now) : undefined}
      actions={
        <Button variant="neutral" size="sm" onClick={() => props.onUnpin()}>
          {t("HEADER_UNPIN_LABEL")}
        </Button>
      }
    />
  );
}
