import { commands } from "../bindings.ts";
import type { CreateClipParams, CreatedClip } from "../../lib/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function createClip(
  params: CreateClipParams,
  options?: InvokeOptions,
): Promise<CreatedClip> {
  return invokeCommand(commands.createClip, [params], options);
}
