import { createEffect, createRoot } from "solid-js";
import { selectedChannel } from "../../lib/stores/view.ts";
import * as channels from "../channels/index.ts";
import * as cheermotes from "./cheermotes.ts";
import * as events from "./events.ts";
import * as load from "./load.ts";
import * as sevenTv from "./sevenTv.ts";
import { clearChannelEmotes } from "./store.ts";

function followSelectedChannel(): () => void {
  return createRoot((dispose) => {
    createEffect(() => {
      const broadcaster = selectedChannel();
      sevenTv.setActive(broadcaster?.id ?? null);
      if (broadcaster) load.loadChannel(broadcaster);
      else clearChannelEmotes();
    });
    return dispose;
  });
}

export function start(): () => void {
  const stops = [
    load.start(),
    events.start(),
    cheermotes.start(),
    channels.onChannel({
      join: (id) => void sevenTv.subscribe(id),
      leave: (id) => {
        sevenTv.unsubscribe(id);
        load.forgetChannel(id);
      },
    }),
    followSelectedChannel(),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
