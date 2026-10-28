import { listenApp, unlistenAll } from "./listen.ts";
import * as sevenTv from "../services/sevenTv.ts";

export function start(): () => void {
  return unlistenAll([listenApp("emoteSetUpdated", sevenTv.applyUpdate)]);
}
