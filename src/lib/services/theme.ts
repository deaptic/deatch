import { setSystemPrefersDark } from "../stores/theme.ts";

const PREFERS_DARK = "(prefers-color-scheme: dark)";

export function start(): () => void {
  const query = window.matchMedia(PREFERS_DARK);
  const sync = () => setSystemPrefersDark(query.matches);
  sync();
  query.addEventListener("change", sync);
  return () => query.removeEventListener("change", sync);
}
