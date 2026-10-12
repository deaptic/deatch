import { eq } from "drizzle-orm";
import { createDb } from "../db/client.ts";
import type { Feature, Hub } from "../hub/feature.ts";
import { usersRepo } from "../users/repo.ts";
import { parseClientMessage, type PresenceState } from "./protocol.ts";
import { watch } from "./schema.ts";

const SQLITE_PARAMS = 100;
const INSERT_ROWS_PER_QUERY = SQLITE_PARAMS / 2;

export const presence: Feature = {
  name: "presence",

  connect(hub, _ws, { identity }, first) {
    if (first) broadcast(hub, identity.providerId, "online");
  },

  async message(hub, ws, { socketId }, body) {
    const msg = parseClientMessage(body);
    if (!msg) return;
    for (let i = 0; i < msg.twitchIds.length; i += INSERT_ROWS_PER_QUERY) {
      hub.db
        .insert(watch)
        .values(
          msg.twitchIds
            .slice(i, i + INSERT_ROWS_PER_QUERY)
            .map((twitchId) => ({ socketId, twitchId })),
        )
        .onConflictDoNothing()
        .run();
    }
    hub.send(ws, {
      type: "presence",
      entries: await lookup(hub, msg.twitchIds),
    });
  },

  async disconnect(hub, { identity, socketId }, last) {
    hub.db.delete(watch).where(eq(watch.socketId, socketId)).run();
    if (!last) return;
    broadcast(hub, identity.providerId, "offline");
    await usersRepo(createDb(hub.env.DB)).upsert(identity);
  },
};

async function lookup(hub: Hub, twitchIds: string[]) {
  const absent = twitchIds.filter((id) => hub.socketsOf(id).length === 0);
  const known = new Set(
    await usersRepo(createDb(hub.env.DB)).known("twitch", absent),
  );
  const stateOf = (twitchId: string): PresenceState =>
    hub.socketsOf(twitchId).length > 0
      ? "online"
      : known.has(twitchId)
      ? "offline"
      : "unknown";
  return twitchIds.map((twitchId) => ({ twitchId, state: stateOf(twitchId) }));
}

function broadcast(hub: Hub, twitchId: string, state: PresenceState) {
  const watchers = hub.db
    .select({ socketId: watch.socketId })
    .from(watch)
    .where(eq(watch.twitchId, twitchId))
    .all();
  for (const { socketId } of watchers) {
    const ws = hub.socket(socketId);
    if (ws) hub.send(ws, { type: "update", twitchId, state });
  }
}
