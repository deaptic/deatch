import { t, tRich } from "../../../../shared/i18n/index.ts";
import Button from "../../../../kit/Button.tsx";
import type { ChannelLink } from "../../../menus/index.ts";
import Banner from "../../../../kit/Banner.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import Text from "../../../../kit/Text.tsx";

export default function RaidRow(props: {
  targetName: string;
  secondsLeft: number;
  targetLink: Pick<ChannelLink, "cursor" | "handlers">;
  onCancel: () => void;
}) {
  return (
    <Banner
      icon={<ActivityIcon kind="raid" />}
      title={tRich("HEADER_RAID_PENDING_STATUS", {
        name: props.targetName,
        seconds: props.secondsLeft,
        target: (chunks) => (
          <b
            class={`font-semibold hover:underline ${props.targetLink.cursor}`}
            {...props.targetLink.handlers}
          >
            {chunks}
          </b>
        ),
        time: (chunks) => (
          <Text bold tabular>
            {chunks}
          </Text>
        ),
      })}
      actions={
        <Button variant="neutral" size="sm" onClick={() => props.onCancel()}>
          {t("HEADER_CANCEL_RAID_LABEL")}
        </Button>
      }
    />
  );
}
