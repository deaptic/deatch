import { commands } from "../bindings.ts";
import type {
  Clip,
  CreateClipParams,
  CreatedClip,
  TopClipsParams,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function createClip(
  params: CreateClipParams,
  options?: InvokeOptions,
): Promise<CreatedClip> {
  return invokeCommand(commands.createClip, [params], options);
}

export function getTopClips(
  params: TopClipsParams,
  options?: InvokeOptions,
): Promise<Clip[]> {
  return invokeCommand(commands.getTopClips, [params], options);
}
