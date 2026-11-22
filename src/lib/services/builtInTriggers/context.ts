import * as users from "../users.ts";
import { typedTarget } from "../triggerMethods.ts";
import { t } from "../../i18n/index.ts";
import type { User, UserRef } from "../../types/index.ts";
import { knownUser } from "../../stores/users.ts";

export type BuiltInContext = {
  broadcasterId: string;
  sender: UserRef;
  args: string;
  isModerator: boolean;
};

const LOGIN = /^\w+$/;

export const channelName = (ctx: BuiltInContext) =>
  knownUser(ctx.broadcasterId)?.displayName ?? "";

export const failed = () => t("TRIGGER_BUILT_IN_FAILED");

function lookup(name: string): Promise<users.Lookup> {
  return LOGIN.test(name)
    ? users.findByLogin(name, { silent: true })
    : Promise.resolve({ status: "missing" });
}

export async function forTarget(
  ctx: BuiltInContext,
  run: (user: User) => Promise<string>,
): Promise<string> {
  const name = typedTarget(ctx.args) ?? ctx.sender.login;
  const found = await lookup(name);
  switch (found.status) {
    case "found":
      return run(found.user);
    case "missing":
      return t("TRIGGER_USER_NOT_FOUND", { name });
    case "failed":
      return failed();
  }
}
