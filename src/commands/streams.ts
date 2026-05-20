import { invokeCommand, type InvokeOptions, type Paginated } from "./utils";

export type GetStreamsParams = {
  userIds?: string[];
  userLogins?: string[];
  gameIds?: string[];
  language?: string;
  first?: number;
  after?: string;
  before?: string;
};
export type GetStreamsResponse = Paginated<{
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: "live" | "";
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  is_mature: boolean;
}>;

export function getStreams(
  params: GetStreamsParams = {},
  options?: InvokeOptions,
): Promise<GetStreamsResponse> {
  return invokeCommand("get_streams", params, options);
}

export type GetAllStreamsParams = {
  userIds?: string[];
  userLogins?: string[];
  gameIds?: string[];
  language?: string;
};

export function getAllStreams(
  params: GetAllStreamsParams = {},
  options?: InvokeOptions,
): Promise<GetStreamsResponse["data"]> {
  return invokeCommand("get_all_streams", params, options);
}

export type GetFollowedStreamsParams = {
  first?: number;
  after?: string;
};
export type GetFollowedStreamsResponse = Paginated<{
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: "live" | "";
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  is_mature: boolean;
}>;

export function getFollowedStreams(
  params: GetFollowedStreamsParams = {},
  options?: InvokeOptions,
): Promise<GetFollowedStreamsResponse> {
  return invokeCommand("get_followed_streams", params, options);
}

export function getAllFollowedStreams(
  options?: InvokeOptions,
): Promise<GetFollowedStreamsResponse["data"]> {
  return invokeCommand("get_all_followed_streams", undefined, options);
}

export type CreateStreamMarkerParams = {
  description?: string;
};

export function createStreamMarker(
  params: CreateStreamMarkerParams = {},
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand("create_stream_marker", params, options);
}
