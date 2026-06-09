import type { UserRef } from "../../types/twitch/user.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type SearchChannel = {
  user: UserRef;
  gameName: string;
  title: string;
  isLive: boolean;
  profileImageUrl: string;
  startedAt: string;
};

export type SearchChannelsParams = {
  query: string;
  liveOnly?: boolean;
  first?: number;
};

export function searchChannels(
  params: SearchChannelsParams,
  options?: InvokeOptions,
): Promise<SearchChannel[]> {
  return invokeCommand("search_channels", params, options);
}

export type Category = {
  id: string;
  name: string;
  boxArtUrl: string;
};

export type SearchCategoriesParams = {
  query: string;
  first?: number;
};

export function searchCategories(
  params: SearchCategoriesParams,
  options?: InvokeOptions,
): Promise<Category[]> {
  return invokeCommand("search_categories", params, options);
}
