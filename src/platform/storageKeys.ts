export const STORAGE_KEYS = {
  preferences: "user_preferences",
  emoteFavorites: "emote_favorites",
  emoteUsage: "emote_usage",
  users: "cache:users",
  globalBadges: "cache:global_badges",
  globalEmotes: "cache:global_emotes",
} as const;

const USER_EMOTES_PREFIX = "cache:user_emotes:";
const MENTIONS_PREFIX = "mentions:";

type PerUserKey =
  | `${typeof USER_EMOTES_PREFIX}${string}`
  | `${typeof MENTIONS_PREFIX}${string}`;

export type StorageKey =
  | (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
  | PerUserKey;

export const userEmotesKey = (userId: string): StorageKey =>
  `${USER_EMOTES_PREFIX}${userId}`;

export const mentionsKey = (userId: string): StorageKey =>
  `${MENTIONS_PREFIX}${userId}`;

const fixedKeys: ReadonlySet<string> = new Set(Object.values(STORAGE_KEYS));

const hasUserId = (key: string, prefix: string) =>
  key.startsWith(prefix) && key.length > prefix.length;

export function isUserEmotesKey(key: string): boolean {
  return hasUserId(key, USER_EMOTES_PREFIX);
}

export function isStorageKey(key: string): key is StorageKey {
  return (
    fixedKeys.has(key) ||
    isUserEmotesKey(key) ||
    hasUserId(key, MENTIONS_PREFIX)
  );
}
