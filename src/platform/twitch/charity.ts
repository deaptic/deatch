import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  CharityCampaign,
} from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getCharityCampaign(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<CharityCampaign | null> {
  return invokeCommand(commands.getCharityCampaign, [params], options);
}
