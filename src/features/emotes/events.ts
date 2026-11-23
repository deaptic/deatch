import { listenApp, unlistenAll } from "../../lib/events/listen.ts";
import * as sevenTv from "./sevenTv.ts";

export function start(): () => void {
  return unlistenAll([listenApp("emoteSetUpdated", sevenTv.applyUpdate)]);
}
