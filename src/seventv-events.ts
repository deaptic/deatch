const WS_URL = "wss://events.7tv.io/v3";

const OP_DISPATCH = 0;
const OP_SUBSCRIBE = 35;

type ActiveEmote = { id: string; name: string };

type DispatchBody = {
  id: string;
  pushed?: Array<{ key: string; value?: ActiveEmote }>;
  pulled?: Array<{ key: string; old_value?: ActiveEmote }>;
  updated?: Array<{ key: string; value?: ActiveEmote; old_value?: ActiveEmote }>;
};

export type EmoteChange =
  | { kind: "add"; name: string; id: string }
  | { kind: "remove"; name: string };

export type SevenTvCleanup = () => void;

export function connectSevenTvEvents(
  emoteSetId: string,
  onChange: (change: EmoteChange) => void
): SevenTvCleanup {
  let ws: WebSocket;
  let stopped = false;

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        op: OP_SUBSCRIBE,
        d: { type: "emote_set.update", condition: { object_id: emoteSetId } },
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.op !== OP_DISPATCH || msg.d?.type !== "emote_set.update") return;

      const body: DispatchBody = msg.d.body;

      for (const item of body.pushed ?? []) {
        if (item.key === "emotes" && item.value) {
          onChange({ kind: "add", name: item.value.name, id: item.value.id });
        }
      }

      for (const item of body.pulled ?? []) {
        if (item.key === "emotes" && item.old_value) {
          onChange({ kind: "remove", name: item.old_value.name });
        }
      }

      for (const item of body.updated ?? []) {
        if (item.key === "emotes") {
          if (item.old_value) onChange({ kind: "remove", name: item.old_value.name });
          if (item.value) onChange({ kind: "add", name: item.value.name, id: item.value.id });
        }
      }
    };

    ws.onclose = () => {
      if (!stopped) setTimeout(connect, 3000);
    };
  }

  connect();

  return () => {
    stopped = true;
    ws?.close();
  };
}
