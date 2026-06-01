import { invokeCommand, type InvokeOptions } from "./utils";

export type DiscordButton = {
  label: string;
  url: string;
};

export type ActivityInput = {
  details?: string;
  detailsUrl?: string;
  stateText?: string;
  stateUrl?: string;
  largeImage?: string;
  largeText?: string;
  largeUrl?: string;
  smallImage?: string;
  smallText?: string;
  startedAt?: number;
  activityType?: "playing" | "listening" | "watching" | "competing";
  statusDisplayType?: "name" | "state" | "details";
  buttons?: DiscordButton[];
};

export type DiscordConnectParams = {
  clientId?: string;
};

export async function discordConnect(
  params: DiscordConnectParams = {},
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand("discord_connect", params, options);
}

export async function discordDisconnect(options?: InvokeOptions): Promise<void> {
  await invokeCommand("discord_disconnect", undefined, options);
}

export async function discordSetActivity(
  params: ActivityInput,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand("discord_set_activity", params, options);
}

export async function discordClearActivity(options?: InvokeOptions): Promise<void> {
  await invokeCommand("discord_clear_activity", undefined, options);
}
