import { events } from "../bindings.ts";
import { unlistenAll } from "./listen.ts";
import * as sevenTv from "../services/sevenTv.ts";

export function start(): () => void {
  return unlistenAll([
    events.emoteSetUpdated.listen((e) => sevenTv.applyUpdate(e.payload)),
  ]);
}
