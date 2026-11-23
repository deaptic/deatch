import { commands } from "../../bindings.ts";
import type { AdSchedule, BroadcasterParams } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

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
