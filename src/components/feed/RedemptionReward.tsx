import type { Redemption } from "../../lib/types/index.ts";

export default function RedemptionReward(props: { redemption: Redemption }) {
  return (
    <span
      class="font-semibold text-event-channel-points"
      title={props.redemption.reward.prompt || undefined}
    >
      {props.redemption.reward.title}
    </span>
  );
}
