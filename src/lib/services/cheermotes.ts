import { getCheermotes } from "../api/twitch/bits.ts";
import { hasCheermotes, setCheermotes } from "../stores/cheermotes.ts";
import { buildCheermoteMap } from "../utils/cheermote.ts";

export async function load(broadcasterId: string): Promise<void> {
  if (hasCheermotes(broadcasterId)) return;
  try {
    const cheermotes = await getCheermotes({ broadcasterId }, { silent: true });
    setCheermotes(broadcasterId, buildCheermoteMap(cheermotes));
  } catch (e) {
    console.warn(`cheermotes for ${broadcasterId} unavailable`, e);
  }
}
