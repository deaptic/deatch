import { searchChannels } from "../api/twitch/search.ts";
import type { SearchChannel } from "../types/index.ts";
import { rankChannels } from "../utils/channelRank.ts";

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
