import { listenApp, unlistenAll } from "../../platform/listen.ts";
import * as sevenTv from "./sevenTv.ts";

export function start(): () => void {
  return unlistenAll([listenApp("emoteSetUpdated", sevenTv.applyUpdate)]);
}
