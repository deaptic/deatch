import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  ChattersPage,
  GetChattersParams,
  UserRef,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export function getChatters(
  params: GetChattersParams,
  options?: InvokeOptions,
): Promise<ChattersPage> {
  return invokeCommand(commands.getChatters, [params], options);
}

export function getChannelModerators(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<UserRef[]> {
  return invokeCommand(commands.getChannelModerators, [params], options);
}

export function getChannelVips(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<UserRef[]> {
  return invokeCommand(commands.getChannelVips, [params], options);
}
