import { commands } from "../../bindings.ts";
import type { BlockParams, UserRef } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

export function getBlockedUsers(options?: InvokeOptions): Promise<UserRef[]> {
  return invokeCommand(commands.getBlockedUsers, [], options);
}

export async function blockUser(
  params: BlockParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.blockUser, [params], {
    successMessage: t("MENU_USER_BLOCKED_TOAST"),
    ...options,
  });
}

export async function unblockUser(
  params: BlockParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.unblockUser, [params], {
    successMessage: t("SETTINGS_BLOCKED_UNBLOCKED_TOAST"),
    ...options,
  });
}
