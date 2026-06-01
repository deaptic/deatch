import { invokeCommand, type InvokeOptions } from "./utils.ts";

export function readKeymap(options?: InvokeOptions): Promise<string> {
  return invokeCommand<string>("read_keymap", undefined, options);
}

export type WriteKeymapParams = { contents: string };

export async function writeKeymap(
  params: WriteKeymapParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand<void>("write_keymap", params, options);
}
