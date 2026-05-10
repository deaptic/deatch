import { fetchAllPages, invokeCommand, type InvokeOptions, type Paginated } from "./utils";

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

export async function getAllStreams(
  params: GetStreamsParams = {},
): Promise<GetStreamsResponse["data"]> {
  return fetchAllPages("get_streams", (after, options) =>
    getStreams({ ...params, after }, options),
  );
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

export async function getAllFollowedStreams(): Promise<GetFollowedStreamsResponse["data"]> {
  return fetchAllPages("get_followed_streams", (after, options) =>
    getFollowedStreams({ after }, options),
  );
}
