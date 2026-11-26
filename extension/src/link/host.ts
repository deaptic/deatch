import { log } from "../shared/log.ts";
import { asRecord, dig } from "../shared/record.ts";

const NATIVE_HOST = "com.deaptic.deatch";
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

type HostEvents = {
  onMessage: (message: unknown) => void;
  onConnect: () => void;
};

export function createHost({ onMessage, onConnect }: HostEvents) {
  let port: chrome.runtime.Port | null = null;
  let delay = RECONNECT_MIN_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function scheduleReconnect() {
    clearTimeout(timer);
    timer = setTimeout(connect, delay);
    delay = Math.min(delay * 2, RECONNECT_MAX_MS);
  }

  function connect() {
    clearTimeout(timer);
    try {
      port = chrome.runtime.connectNative(NATIVE_HOST);
    } catch {
      scheduleReconnect();
      return;
    }
    port.onDisconnect.addListener((closed) => {
      log.warn(
        "native host disconnected",
        chrome.runtime.lastError?.message ?? dig(closed, "error", "message"),
      );
      port = null;
      scheduleReconnect();
    });
    port.onMessage.addListener((message: unknown) => {
      delay = RECONNECT_MIN_MS;
      onMessage(message);
    });
    onConnect();
  }

  function post(message: object): boolean {
    if (!port) return false;
    try {
      port.postMessage(message);
      return true;
    } catch (error) {
      log.warn("message to app not sent", asRecord(message).type, error);
      return false;
    }
  }

  return { start: connect, post, isConnected: () => port !== null };
}
