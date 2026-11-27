import { createSignal } from "solid-js";
import { type AppInfo, appInfo } from "../../platform/app.ts";

const [info, setInfo] = createSignal<AppInfo | null>(null);

let loading: Promise<AppInfo> | null = null;

export function load(): Promise<AppInfo> {
  loading ??= appInfo({ silent: true }).then(
    (loaded) => {
      setInfo(loaded);
      return loaded;
    },
    (e: unknown) => {
      loading = null;
      throw e;
    },
  );
  return loading;
}

export const name = () => info()?.name ?? "";
export const version = () => info()?.version ?? "";

export function start(): () => void {
  load().catch(() => {});
  return () => {};
}
