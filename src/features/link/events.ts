import { listenApp, unlistenAll } from "../../platform/listen.ts";
import { linkRequestState } from "../../platform/link.ts";
import { applyState, disconnect, watchSignIn } from "./store.ts";

export function start(): () => void {
  const stopListening = unlistenAll([
    listenApp("linkState", applyState),
    listenApp("linkDisconnected", disconnect),
  ]);
  const stopWatching = watchSignIn();
  linkRequestState({ silent: true }).catch(() => {});
  return () => {
    stopListening();
    stopWatching();
    disconnect();
  };
}
