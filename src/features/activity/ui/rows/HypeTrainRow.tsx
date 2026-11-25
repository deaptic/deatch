import { t } from "../../../../shared/i18n/index.ts";
import type { HypeTrain } from "../../../../shared/types/index.ts";
import Meter from "../../../../kit/Meter.tsx";
import Banner from "../../../../kit/Banner.tsx";
import { ActivityIcon } from "../ActivityIcon.tsx";
import { untilIso } from "./countdown.ts";

export default function HypeTrainRow(props: { train: HypeTrain; now: number }) {
  const title = () =>
    t("HEADER_HYPE_TRAIN_LEVEL_STATUS", { level: props.train.level });
  return (
    <Banner
      icon={<ActivityIcon kind="hypeTrain" />}
      title={title()}
      meta={untilIso(props.train.expiresAt, props.now)}
    >
      <Meter
        value={props.train.progress}
        max={props.train.goal}
        label={title()}
        tone="accent"
      />
    </Banner>
  );
}
