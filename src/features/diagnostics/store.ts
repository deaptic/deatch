import { createSignal } from "solid-js";
import { unwrap } from "solid-js/store";
import { getAppStats } from "../../platform/diagnostics.ts";
import { feeds } from "../feed/index.ts";
import { knownUsers } from "../users/index.ts";
import { countCache, type Sample } from "./model.ts";

const POLL_MS = 1000;

const [sample, setSample] = createSignal<Sample | null>(null);
export { sample };

type ChromiumPerformance = Performance & {
  memory?: { usedJSHeapSize: number };
};

function jsHeapBytes(): number | null {
  return (performance as ChromiumPerformance).memory?.usedJSHeapSize ?? null;
}

export function watch(): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = async () => {
    const app = await getAppStats({ silent: true }).catch(() => null);
    if (app && !stopped) {
      setSample({
        app,
        cache: countCache(unwrap(feeds), unwrap(knownUsers)),
        jsHeapBytes: jsHeapBytes(),
      });
    }
    if (!stopped) timer = setTimeout(tick, POLL_MS);
  };
  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
    setSample(null);
  };
}
