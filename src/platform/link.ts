import { commands } from "./bindings.ts";
import type {
  LinkChannelParams,
  RedeemParams,
  ClaimDropsParams,
  SetCompressorParams,
  SetGainParams,
  SetMutedParams,
} from "../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

export async function linkSetMuted(
  params: SetMutedParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkSetMuted, [params], options);
}

export async function linkSetGain(
  params: SetGainParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkSetGain, [params], options);
}

export async function linkRequestState(options?: InvokeOptions): Promise<void> {
  await invokeCommand(commands.linkRequestState, [], options);
}

export async function linkFocus(
  params: LinkChannelParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkFocus, [params], options);
}

export async function linkClaimBonus(
  params: LinkChannelParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkClaimBonus, [params], options);
}

export async function linkRedeem(
  params: RedeemParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkRedeem, [params], options);
}

export async function linkSetCompressor(
  params: SetCompressorParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkSetCompressor, [params], options);
}

export async function linkClaimDrops(
  params: ClaimDropsParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkClaimDrops, [params], options);
}

export async function linkClose(
  params: LinkChannelParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.linkClose, [params], options);
}
