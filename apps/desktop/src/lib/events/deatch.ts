import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import {
  presenceById,
  setApiState,
  setPresenceById,
} from "../stores/deatch.ts";

export function start(): () => void {
  return unlistenAll([
    events.deatchConnection.listen((e) => {
      setApiState(e.payload.connected ? "connected" : "disconnected");
      if (!e.payload.connected) {
        setPresenceById(
          new Map([...presenceById().keys()].map((id) => [id, "offline"])),
        );
      }
    }),
    events.deatchPresence.listen((e) => {
      const next = new Map(presenceById());
      for (const { twitchId, state } of e.payload.entries) {
        if (state === "unknown") next.delete(twitchId);
        else next.set(twitchId, state);
      }
      setPresenceById(next);
    }),
  ]);
}
