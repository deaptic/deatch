import { invoke } from "@tauri-apps/api/core";
import { advancedShowLogs } from "../state/preferences";
import { addToast } from "../state/toasts";

export type Paginated<T> = { data: T[]; pagination: { cursor: string | null } };

export type InvokeOptions = { silent?: boolean };

export async function invokeCommand<T>(
  cmd: string,
  params?: Record<string, unknown>,
  options: InvokeOptions = {},
): Promise<T> {
  const start = performance.now();
  try {
    const result = await invoke<T>(cmd, params === undefined ? undefined : { params });
    const ms = Math.round(performance.now() - start);
    console.log(`[cmd] ${cmd}`, { params, result, ms });
    if (!options.silent && advancedShowLogs()) addToast(cmd, "log", summarize(result, ms));
    return result;
  } catch (e) {
    const ms = Math.round(performance.now() - start);
    console.error(`[cmd] ${cmd} failed`, { params, error: e, ms });
    addToast(cmd, "error", `${ms}ms · ${String(e)}`);
    throw e;
  }
}

function summarize(result: unknown, ms: number): string {
  if (Array.isArray(result)) return `${ms}ms · ${result.length} items`;
  if (
    result !== null &&
    typeof result === "object" &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    const data = (result as { data: unknown[]; pagination?: { cursor: string | null } }).data;
    const more = (result as { pagination?: { cursor: string | null } }).pagination?.cursor;
    return `${ms}ms · ${data.length} items${more ? " · more…" : ""}`;
  }
  return `${ms}ms`;
}

export async function fetchAllPages<T>(
  cmd: string,
  fetcher: (after: string | undefined, options: InvokeOptions) => Promise<Paginated<T>>,
): Promise<T[]> {
  const start = performance.now();
  const all: T[] = [];
  let after: string | undefined;
  let pages = 0;
  while (true) {
    const page = await fetcher(after, { silent: true });
    all.push(...page.data);
    pages++;
    if (!page.pagination.cursor) break;
    after = page.pagination.cursor;
  }
  const ms = Math.round(performance.now() - start);
  if (advancedShowLogs()) {
    addToast(cmd, "log", `${ms}ms · ${all.length} items · ${pages} pages`);
  }
  return all;
}
