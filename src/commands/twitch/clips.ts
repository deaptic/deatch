import { invokeCommand, type InvokeOptions } from "../utils";

export type CreateClipParams = {
  broadcasterId: string;
  title?: string;
  duration?: number;
};

export type CreatedClip = {
  id: string;
};

export function createClip(
  params: CreateClipParams,
  options?: InvokeOptions,
): Promise<CreatedClip> {
  return invokeCommand("create_clip", params, options);
}
