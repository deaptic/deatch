import { commands } from "../bindings.ts";
import type { AdSchedule, BroadcasterParams } from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";
import { t } from "../../lib/i18n/index.ts";

export function getAdSchedule(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<AdSchedule | null> {
  return invokeCommand(commands.getAdSchedule, [params], options);
}

export async function snoozeNextAd(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.snoozeNextAd, [params], {
    successMessage: t("HEADER_AD_SNOOZED_TOAST"),
    ...options,
  });
}
