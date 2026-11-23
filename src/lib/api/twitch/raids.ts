import { commands } from "../../bindings.ts";
import type {
  BroadcasterPairParams,
  BroadcasterParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

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
