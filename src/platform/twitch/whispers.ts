import { commands } from "../bindings.ts";
import type {
  MarkWhispersReadParams,
  SaveWhispersParams,
  SendWhisperParams,
  Whisper,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";

export async function sendWhisper(
  params: SendWhisperParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.sendWhisper, [params], options);
}

export function listWhispers(options?: InvokeOptions): Promise<Whisper[]> {
  return invokeCommand(commands.whispersList, [], options);
}

export async function saveWhispers(
  params: SaveWhispersParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.whispersSave, [params], options);
}

export async function markWhispersRead(
  params: MarkWhispersReadParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.whispersMarkRead, [params], options);
}
