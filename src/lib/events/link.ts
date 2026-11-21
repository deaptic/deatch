import { listenApp, unlistenAll } from "./listen.ts";
import * as link from "../services/link.ts";
import { linkRequestState } from "../api/link.ts";

export function start(): () => void {
  const stop = unlistenAll([
    listenApp("linkState", link.applyState),
    listenApp("linkDisconnected", link.disconnect),
  ]);
  linkRequestState({ silent: true }).catch(() => {});
  return () => {
    stop();
    link.disconnect();
  };
}
