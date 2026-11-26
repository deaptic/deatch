import { knownUser } from "../users/index.ts";
import * as link from "../link/index.ts";
import { addToast } from "../../kit/toasts.ts";
import { t } from "../../shared/i18n/index.ts";
import type { LinkDrop } from "../../shared/types/index.ts";

const loginOf = (broadcasterId: string) => knownUser(broadcasterId)?.login;

export function dropOf(broadcasterId: string): LinkDrop | null {
  const login = loginOf(broadcasterId);
  return login ? link.drop(login) : null;
}

export async function claimDrops(broadcasterId: string): Promise<void> {
  const login = loginOf(broadcasterId);
  const drop = dropOf(broadcasterId);
  if (!login || !drop) return;
  const error = await link.claimDrops(login);
  if (error === null || dropOf(broadcasterId) === null) return;
  addToast(
    t("HEADER_ACTIVITY_DROP_CLAIM_FAILED_ERROR", {
      reward: drop.reward ?? drop.game,
      code: error,
    }),
    "error",
  );
}
