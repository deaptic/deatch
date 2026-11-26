const NON_CHANNEL_PATHS = new Set([
  "directory",
  "settings",
  "subscriptions",
  "wallet",
  "inventory",
  "drops",
  "friends",
  "following",
  "messages",
  "search",
  "p",
  "popout",
  "videos",
  "downloads",
  "turbo",
  "prime",
  "jobs",
  "store",
  "payments",
  "login",
  "signup",
  "logout",
  "moderator",
  "embed",
  "team",
  "activate",
]);

export function channelFromPath(pathname: string): string | null {
  const name = pathname.split("/").find(Boolean)?.toLowerCase();
  if (!name || NON_CHANNEL_PATHS.has(name)) return null;
  return /^[a-z0-9_]{3,25}$/.test(name) ? name : null;
}

export function channelFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!/^(www\.|m\.)?twitch\.tv$/.test(parsed.hostname)) return null;
  return channelFromPath(parsed.pathname);
}

export function currentChannel(): string | null {
  return channelFromPath(location.pathname);
}
