import { listenApp, unlistenAll } from "../../platform/listen.ts";
import { linkRequestState } from "../../platform/link.ts";
import { applyAnswer, applyState, disconnect, watchSignIn } from "./store.ts";

export function start(): () => void {
  const listeners = [
    listenApp("linkState", applyState),
    listenApp("linkDisconnected", disconnect),
    listenApp("linkAnswer", applyAnswer),
  ];
  const stopListening = unlistenAll(listeners);
  const stopWatching = watchSignIn();
  Promise.all(listeners)
    .then(() => linkRequestState({ silent: true }))
    .catch(() => {});
  return () => {
    stopListening();
    stopWatching();
    disconnect();
  };
}
