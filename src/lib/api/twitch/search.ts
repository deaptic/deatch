import { commands } from "../../bindings.ts";
import type {
  Category,
  SearchCategoriesParams,
  SearchChannel,
  SearchChannelsParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export type { Category, SearchChannel } from "../../types/index.ts";

export function searchChannels(
  params: SearchChannelsParams,
  options?: InvokeOptions,
): Promise<SearchChannel[]> {
  return invokeCommand(commands.searchChannels, [params], options);
}

export function searchCategories(
  params: SearchCategoriesParams,
  options?: InvokeOptions,
): Promise<Category[]> {
  return invokeCommand(commands.searchCategories, [params], options);
}
