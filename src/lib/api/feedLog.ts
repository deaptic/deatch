import { commands } from "../bindings.ts";
import type { AppendParams, AroundParams, PageParams } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

export function feedlogAppend(
  params: AppendParams,
  options?: InvokeOptions,
): Promise<null> {
  return invokeCommand(commands.feedlogAppend, [params], options);
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

export function feedlogClear(options?: InvokeOptions): Promise<null> {
  return invokeCommand(commands.feedlogClear, [], options);
}
