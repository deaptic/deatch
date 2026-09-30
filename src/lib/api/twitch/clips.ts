import { commands } from "../../bindings.ts";
import type { CreateClipParams, CreatedClip } from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function createClip(
  params: CreateClipParams,
  options?: InvokeOptions,
): Promise<CreatedClip> {
  return invokeCommand(commands.createClip, [params], options);
}
