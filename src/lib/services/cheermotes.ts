import { getCheermotes } from "../api/twitch/bits.ts";
import { hasCheermotes, setCheermotes } from "../stores/cheermotes.ts";
import { buildCheermoteMap } from "../utils/cheermote.ts";

export async function load(broadcasterId: string): Promise<void> {
  if (hasCheermotes(broadcasterId)) return;
  await getCheermotes({ broadcasterId }, { silent: true }).then(
    (cheermotes) => setCheermotes(broadcasterId, buildCheermoteMap(cheermotes)),
    () => {},
  );
}
