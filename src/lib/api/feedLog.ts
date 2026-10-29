import { commands } from "../bindings.ts";
import type { AppendParams, AroundParams, PageParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export async function feedlogAppend(
  params: AppendParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.feedlogAppend, [params], options);
}

export function feedlogPage(
  params: PageParams,
  options?: InvokeOptions,
): Promise<string[]> {
  return invokeCommand(commands.feedlogPage, [params], options);
}

export function feedlogAround(
  params: AroundParams,
  options?: InvokeOptions,
): Promise<string[] | null> {
  return invokeCommand(commands.feedlogAround, [params], options);
}

export async function feedlogClear(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.feedlogClear, [], options);
}
