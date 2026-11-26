import { log } from "../../shared/log.ts";
import { dig, type Loose } from "../../shared/record.ts";
import { earnedDrops } from "../drops.ts";
import type { Finder } from "./finder.ts";
import { mutation, query } from "./graphql.ts";
import type { FiberRoot } from "../../shared/react.ts";

const CLAIM_GAP_MS = 3000;
const CLAIMED: ReadonlySet<unknown> = new Set([
  "ELIGIBLE_FOR_ALL",
  "DROP_INSTANCE_ALREADY_CLAIMED",
]);
const EARNED_NOTIFICATION = "user_drop_reward_reminder_notification";

export const isDropEarned = (message: Loose) =>
  dig(message.data, "notification", "type") === EARNED_NOTIFICATION;

const DROPS = query("DropsInProgress", {
  currentUser: {
    id: true,
    inventory: {
      dropCampaignsInProgress: {
        id: true,
        status: true,
        timeBasedDrops: {
          id: true,
          self: {
            dropInstanceID: true,
            hasPreconditionsMet: true,
            isClaimed: true,
          },
        },
      },
    },
  },
});
const CLAIM_DROP = mutation("ClaimDrop", "ClaimDropRewardsInput", {
  claimDropRewards: { dropInstanceID: true, status: true },
});

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

export function createDrops(finder: Finder, isWanted: () => boolean) {
  let claiming = false;
  let checked = false;

  async function claimEarned(manual = false): Promise<string | null> {
    const client = finder.client();
    if (!client) return "PAGE_NOT_READY";
    if (claiming || (!manual && !isWanted())) return null;
    claiming = true;
    let failure: string | null = null;
    try {
      const result = await client.query({
        query: DROPS,
        fetchPolicy: "network-only",
      });
      const campaigns = dig(
        result.data,
        "currentUser",
        "inventory",
        "dropCampaignsInProgress",
      );
      for (const dropInstanceID of earnedDrops(campaigns)) {
        const claim = await client.mutate({
          mutation: CLAIM_DROP,
          variables: { input: { dropInstanceID } },
        });
        const status = dig(claim.data, "claimDropRewards", "status");
        if (!CLAIMED.has(status)) {
          log.warn("drop not claimed", dropInstanceID, status);
          failure = typeof status === "string" ? status : "NOT_CLAIMED";
        }
        await wait(CLAIM_GAP_MS);
      }
    } catch (error) {
      log.error("drop claim failed", error);
      failure = "FAILED";
    } finally {
      claiming = false;
    }
    return failure;
  }

  function update(root: FiberRoot) {
    if (!isWanted()) {
      checked = false;
      return;
    }
    if (checked) return;
    if (!finder.client()) finder.rescan(root);
    if (!finder.client()) return;
    checked = true;
    void claimEarned();
  }

  return { update, claimEarned };
}
