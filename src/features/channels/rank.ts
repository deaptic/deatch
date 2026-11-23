import type { SearchChannel } from "../../shared/types/index.ts";

function closeness(query: string, login: string, displayName: string): number {
  const names = [login, displayName];
  if (names.includes(query)) return 0;
  if (names.some((name) => name.startsWith(query))) return 1;
  if (names.some((name) => name.includes(query))) return 2;
  return 3;
}

export function rankChannels(
  query: string,
  channels: readonly SearchChannel[],
): SearchChannel[] {
  const needle = query.trim().toLowerCase();
  return channels
    .map((channel) => {
      const login = channel.user.login;
      const rank = closeness(
        needle,
        login,
        channel.user.displayName.toLowerCase(),
      );
      return { channel, login, rank };
    })
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.login.length - b.login.length ||
        a.login.localeCompare(b.login),
    )
    .map(({ channel }) => channel);
}
