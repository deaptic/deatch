import { Show } from "solid-js";
import { t } from "../../../lib/i18n/index.ts";
import { formatDonation } from "../../../lib/format/currency.ts";
import type { CharityCampaign } from "../../../lib/types/index.ts";
import Meter from "../../ui/Meter.tsx";
import ActivityRow from "../ActivityRow.tsx";
import { ActivityIcon } from "../activityIcons.tsx";

export default function CharityRow(props: { charity: CharityCampaign }) {
  const raised = () => formatDonation(props.charity.current);
  const target = () => props.charity.target;
  const meta = () => {
    const goal = target();
    return goal
      ? t("HEADER_CHARITY_PROGRESS_STATUS", {
          current: raised(),
          target: formatDonation(goal),
        })
      : t("HEADER_CHARITY_RAISED_STATUS", { current: raised() });
  };
  return (
    <ActivityRow
      icon={<ActivityIcon kind="charity" />}
      title={props.charity.charityName}
      meta={meta()}
    >
      <Show when={target()}>
        {(goal) => (
          <Meter
            value={props.charity.current.value}
            max={goal().value}
            label={t("HEADER_CHARITY_PROGRESS_LABEL")}
            tone="accent"
          />
        )}
      </Show>
    </ActivityRow>
  );
}
