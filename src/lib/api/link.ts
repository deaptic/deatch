import { commands } from "../bindings.ts";
import type {
  LinkChannelParams,
  SetAudioParams,
  SetMutedParams,
} from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function linkSetMuted(
  params: SetMutedParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkSetMuted, [params], options);
}

export async function linkSetAudio(
  params: SetAudioParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkSetAudio, [params], options);
}

export async function linkRequestState(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.linkRequestState, [], options);
}

export async function linkFocus(
  params: LinkChannelParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkFocus, [params], options);
}

export async function linkClose(
  params: LinkChannelParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkClose, [params], options);
}
