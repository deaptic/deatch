import { commands } from "../bindings.ts";
import type {
  BroadcasterPairParams,
  BroadcasterParams,
} from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";
import { t } from "../../shared/i18n/index.ts";

export async function startRaid(
  params: BroadcasterPairParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.startRaid, [params], {
    successMessage: t("HEADER_RAID_STARTED_TOAST"),
    ...options,
  });
}

export async function cancelRaid(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.cancelRaid, [params], {
    successMessage: t("HEADER_RAID_CANCELED_TOAST"),
    ...options,
  });
}
