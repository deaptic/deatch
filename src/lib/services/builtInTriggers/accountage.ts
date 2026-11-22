import { t } from "../../i18n/index.ts";
import { formatElapsed } from "../../format/duration.ts";
import { type BuiltInContext, forTarget } from "./context.ts";

export function accountage(ctx: BuiltInContext): Promise<string> {
  return forTarget(ctx, (user) =>
    Promise.resolve(
      t("TRIGGER_ACCOUNTAGE", {
        target: user.displayName,
        duration: formatElapsed(Date.parse(user.createdAt), Date.now()),
      }),
    ),
  );
}
