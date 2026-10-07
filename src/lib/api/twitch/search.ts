import { commands } from "../../bindings.ts";
import type {
  Category,
  SearchChannel,
  SearchParams,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";

export function searchChannels(
  params: SearchParams,
  options?: InvokeOptions,
): Promise<SearchChannel[]> {
  return invokeCommand(commands.searchChannels, [params], options);
}

export function searchCategories(
  params: SearchParams,
  options?: InvokeOptions,
): Promise<Category[]> {
  return invokeCommand(commands.searchCategories, [params], options);
}
