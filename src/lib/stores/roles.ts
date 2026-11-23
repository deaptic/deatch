import {
  allows,
  type Capability,
  type ChannelRole,
  meets,
  roleOf,
} from "../utils/roles.ts";
import { moderationActionsDisabled } from "./preferences/moderation.ts";
import { moderatedChannels, user } from "./users.ts";

export function roleIn(channelId: string): ChannelRole {
  return roleOf(
    channelId,
    user()?.id,
    new Set(moderatedChannels().map((m) => m.id)),
  );
}

export function hasPermission(channelId: string, capability: Capability) {
  return allows(roleIn(channelId), capability);
}

export function showsControls(channelId: string, capability: Capability) {
  return !moderationActionsDisabled() && hasPermission(channelId, capability);
}

export function showsRole(channelId: string, required: ChannelRole) {
  if (required === "everyone") return true;
  return !moderationActionsDisabled() && meets(roleIn(channelId), required);
}

export function isOwnChannel(channelId: string): boolean {
  return roleIn(channelId) === "broadcaster";
}
