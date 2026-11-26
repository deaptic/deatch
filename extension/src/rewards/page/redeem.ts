import { dig, stringOrNull } from "../../shared/record.ts";
import type { RedeemAsk } from "../../shared/protocol.ts";
import { mutation } from "./graphql.ts";
import type { Apollo, TwitchPoints } from "./twitch.ts";

const REDEEM = mutation(
  "RedeemCustomReward",
  "RedeemCommunityPointsCustomRewardInput",
  { redeemCommunityPointsCustomReward: { error: { code: true } } },
);

function transactionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function redeem(
  client: Apollo | null,
  points: TwitchPoints | null,
  ask: RedeemAsk,
): Promise<string | null> {
  const reward = points?.customRewards.find((r) => r.id === ask.reward);
  if (!client || !points || !reward) return "REWARD_NOT_FOUND";
  if (reward.cost !== ask.cost) return "COST_CHANGED";
  const input = reward.isUserInputRequired ? ask.text?.trim() : null;
  if (reward.isUserInputRequired && !input) return "TEXT_REQUIRED";
  if (points.balance < reward.cost) return "NOT_ENOUGH_POINTS";
  const result = await client.mutate({
    mutation: REDEEM,
    variables: {
      input: {
        channelID: points.channelID,
        cost: reward.cost,
        prompt: reward.prompt ?? null,
        rewardID: reward.id,
        textInput: input,
        title: reward.title,
        transactionID: transactionId(),
      },
    },
  });
  return stringOrNull(
    dig(result.data, "redeemCommunityPointsCustomReward", "error", "code"),
  );
}
