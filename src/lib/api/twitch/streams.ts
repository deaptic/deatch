import { commands } from "../../bindings.ts";
import type {
  CreateStreamMarkerParams,
  GetStreamsFromIdsParams,
  GetStreamsParams,
  PaginatedResponse,
  Stream,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type { Stream } from "../../types/index.ts";

export function getStreams(
  params: GetStreamsParams = {},
  options?: InvokeOptions,
): Promise<PaginatedResponse<Stream>> {
  return invokeCommand(commands.getStreams, [params], options);
}

export function getStreamsFromIds(
  params: GetStreamsFromIdsParams,
  options?: InvokeOptions,
): Promise<Stream[]> {
  return invokeCommand(commands.getStreamsFromIds, [params], options);
}

export function getFollowedStreams(options?: InvokeOptions): Promise<Stream[]> {
  return invokeCommand(commands.getFollowedStreams, [], options);
}

export async function createStreamMarker(
  params: CreateStreamMarkerParams = {},
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.createStreamMarker, [params], {
    successMessage: "Marker added",
    ...options,
  });
}
