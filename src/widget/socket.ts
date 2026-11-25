import type { Frame } from "../features/widgets/index.ts";

const RETRY_MS = 2_000;

type Handlers = {
  frame: (frame: Frame) => void;
  closed: () => void;
};

export function connect(url: string, on: Handlers): () => void {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  function open() {
    socket = new WebSocket(url);
    socket.onmessage = (e: MessageEvent<string>) =>
      on.frame(JSON.parse(e.data) as Frame);
    socket.onclose = () => {
      on.closed();
      if (!stopped) retry = setTimeout(open, RETRY_MS);
    };
  }

  open();
  return () => {
    stopped = true;
    clearTimeout(retry);
    socket?.close();
  };
}
