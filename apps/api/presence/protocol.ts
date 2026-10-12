export type PresenceState = "online" | "offline" | "unknown";

export type ClientMessage = { type: "subscribe"; twitchIds: string[] };

export const SUBSCRIBE_LIMIT = 100;

export function parseClientMessage(
  body: Record<string, unknown>,
): ClientMessage | null {
  const { type, twitchIds } = body as Partial<ClientMessage>;
  const valid = type === "subscribe" &&
    Array.isArray(twitchIds) &&
    twitchIds.length <= SUBSCRIBE_LIMIT &&
    twitchIds.every((id) => typeof id === "string" && id.length > 0);
  return valid ? { type, twitchIds } : null;
}
