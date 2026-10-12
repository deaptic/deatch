export type Bindings = {
  DB: D1Database;
  HUB: DurableObjectNamespace;
  TWITCH_CLIENT_ID: string;
};

export function twitchClientId(env: Record<string, unknown>): string {
  const value = env.TWITCH_CLIENT_ID;
  if (typeof value !== "string" || !value) {
    throw new Error("missing required binding TWITCH_CLIENT_ID");
  }
  return value;
}
