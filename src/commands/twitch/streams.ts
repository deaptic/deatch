import type { Stream } from "../../types/twitch/stream";
import { invokeCommand, type InvokeOptions, type PaginatedResponse } from "../utils";

export type { Stream } from "../../types/twitch/stream";

export type GetStreamsParams = {
  userIds?: string[];
  userLogins?: string[];
  gameIds?: string[];
  language?: string;
  first?: number;
  after?: string;
  before?: string;
};

export function getStreams(
  params: GetStreamsParams = {},
  options?: InvokeOptions,
): Promise<PaginatedResponse<Stream>> {
  return invokeCommand("get_streams", params, options);
}

export type GetFollowedStreamsParams = {
  first?: number;
  after?: string;
};

export function getFollowedStreams(
  params: GetFollowedStreamsParams = {},
  options?: InvokeOptions,
): Promise<PaginatedResponse<Stream>> {
  return invokeCommand("get_followed_streams", params, options);
}

export type CreateStreamMarkerParams = {
  description?: string;
};

export function createStreamMarker(
  params: CreateStreamMarkerParams = {},
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("create_stream_marker", params, { successMessage: "Marker added", ...options });
}
