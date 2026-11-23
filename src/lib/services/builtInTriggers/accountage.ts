import { t } from "../../i18n/index.ts";
import { formatElapsed } from "../../format/duration.ts";
import { Time } from "../../utils/time.ts";
import { type BuiltInContext, forTarget } from "./context.ts";

export function accountage(ctx: BuiltInContext): Promise<string> {
  return forTarget(ctx, (user, self) =>
    Promise.resolve(
      t("TRIGGER_ACCOUNTAGE_REPLY", {
        target: user.displayName,
        self: String(self),
        duration: formatElapsed(Date.parse(user.createdAt), Date.now()),
        date: new Time(user.createdAt, "d").toString(),
      }),
    ),
  );
}
