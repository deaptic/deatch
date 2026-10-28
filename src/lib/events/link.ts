import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import * as link from "../services/link.ts";
import { linkRequestState } from "../api/link.ts";

export function start(): () => void {
  const stop = unlistenAll([
    events.linkState.listen((e) => link.applyState(e.payload)),
    events.linkDisconnected.listen(link.disconnect),
  ]);
  // No host connected yet is the normal case at startup.
  linkRequestState({ silent: true }).catch(() => {});
  return () => {
    stop();
    link.disconnect();
  };
}
