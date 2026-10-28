/// Every key the app keeps in localStorage; anything else is left over from
/// an earlier version and is pruned at startup.
export const STORAGE_KEYS = {
  preferences: "user_preferences",
  mentions: "mentions",
  emoteFavorites: "emote_favorites",
  users: "cache:users",
  globalBadges: "cache:global_badges",
  globalEmotes: "cache:global_emotes",
} as const;

const USER_EMOTES_PREFIX = "cache:user_emotes:";

export type StorageKey =
  | (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
  | `${typeof USER_EMOTES_PREFIX}${string}`;

export const userEmotesKey = (userId: string): StorageKey =>
  `${USER_EMOTES_PREFIX}${userId}`;

const fixedKeys: ReadonlySet<string> = new Set(Object.values(STORAGE_KEYS));

export function isStorageKey(key: string): key is StorageKey {
  return (
    fixedKeys.has(key) ||
    (key.startsWith(USER_EMOTES_PREFIX) &&
      key.length > USER_EMOTES_PREFIX.length)
  );
}
