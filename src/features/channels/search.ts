import { searchChannels } from "../../platform/twitch/search.ts";
import type { SearchChannel } from "../../shared/types/index.ts";
import { rankChannels } from "./rank.ts";

const FETCHED = 20;
const SHOWN = 8;

export function find(
  query: string,
  keep: (channel: SearchChannel) => boolean = () => true,
): Promise<SearchChannel[]> {
  return searchChannels({ query, first: FETCHED }, { silent: true }).then(
    (found) => rankChannels(query, found.filter(keep)).slice(0, SHOWN),
  );
}
