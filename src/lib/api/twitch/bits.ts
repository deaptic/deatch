import { commands } from "../../bindings.ts";
import type { Cheermote, GetCheermotesParams } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function getCheermotes(
  params: GetCheermotesParams,
  options?: InvokeOptions,
): Promise<Cheermote[]> {
  return invokeCommand(commands.getCheermotes, [params], options);
}
