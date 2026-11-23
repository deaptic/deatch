import { commands } from "../../bindings.ts";
import type { BroadcasterParams, CharityCampaign } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getCharityCampaign(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<CharityCampaign | null> {
  return invokeCommand(commands.getCharityCampaign, [params], options);
}
