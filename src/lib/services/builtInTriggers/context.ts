import * as users from "../users.ts";
import { typedTarget } from "../triggerMethods.ts";
import { t } from "../../i18n/index.ts";
import type { User, UserRef } from "../../types/index.ts";

export type BuiltInContext = {
  broadcasterId: string;
  sender: UserRef;
  args: string;
  isModerator: boolean;
};

const LOGIN = /^\w+$/;

export const failed = () => t("TRIGGER_FAILED_REPLY");

function lookup(name: string): Promise<users.Lookup> {
  return LOGIN.test(name)
    ? users.findByLogin(name, { silent: true })
    : Promise.resolve({ status: "missing" });
}

export async function forTarget(
  ctx: BuiltInContext,
  run: (user: User, self: boolean) => Promise<string>,
): Promise<string> {
  const name = typedTarget(ctx.args) ?? ctx.sender.login;
  const found = await lookup(name);
  switch (found.status) {
    case "found":
      return run(found.user, found.user.id === ctx.sender.id);
    case "missing":
      return t("TRIGGER_USER_NOT_FOUND_REPLY", { name });
    case "failed":
      return failed();
  }
}
