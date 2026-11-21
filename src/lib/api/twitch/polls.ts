import { commands } from "../../bindings.ts";
import type {
  BroadcasterParams,
  CreatePollParams,
  EndPollParams,
  Poll,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { t } from "../../i18n/index.ts";

export function getActivePoll(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<Poll | null> {
  return invokeCommand(commands.getActivePoll, [params], options);
}

export async function createPoll(
  params: CreatePollParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.createPoll, [params], {
    successMessage: t("TOAST_POLL_STARTED"),
    ...options,
  });
}

export async function endPoll(
  params: EndPollParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.endPoll, [params], {
    successMessage: t("TOAST_POLL_ENDED"),
    ...options,
  });
}
