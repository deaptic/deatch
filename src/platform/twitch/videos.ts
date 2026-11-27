import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  LastStream,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getLastStream(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<LastStream | null> {
  return invokeCommand(commands.getLastStream, [params], options);
}
