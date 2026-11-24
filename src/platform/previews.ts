import { commands } from "./bindings.ts";
import type { LinkPreview } from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export function linkPreview(
  url: string,
  options?: InvokeOptions,
): Promise<LinkPreview | null> {
  return invokeCommand(commands.linkPreview, [{ url }], options);
}
