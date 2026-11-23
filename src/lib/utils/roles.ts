export const CHANNEL_ROLES = ["everyone", "moderator", "broadcaster"] as const;

export type ChannelRole = (typeof CHANNEL_ROLES)[number];

export const CAPABILITIES = {
  moderate: "moderator",
  manageStream: "broadcaster",
  manageRoles: "broadcaster",
  viewBans: "broadcaster",
  viewSubscriptions: "broadcaster",
} as const satisfies Record<string, ChannelRole>;

export type Capability = keyof typeof CAPABILITIES;

export function meets(role: ChannelRole, required: ChannelRole): boolean {
  return CHANNEL_ROLES.indexOf(role) >= CHANNEL_ROLES.indexOf(required);
}

export function allows(role: ChannelRole, capability: Capability): boolean {
  return meets(role, CAPABILITIES[capability]);
}

export function roleOf(
  channelId: string,
  userId: string | undefined,
  moderatedIds: ReadonlySet<string>,
): ChannelRole {
  if (userId !== undefined && channelId === userId) return "broadcaster";
  return moderatedIds.has(channelId) ? "moderator" : "everyone";
}
