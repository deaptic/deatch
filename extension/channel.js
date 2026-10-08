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
]);

function channelFromUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)twitch\.tv$/.test(u.hostname)) return null;
  const seg = u.pathname.split("/").filter(Boolean);
  // Channel pages have exactly one path segment (e.g. /xqc, not /xqc/clip/...).
  if (seg.length !== 1) return null;
  const name = seg[0].toLowerCase();
  if (NON_CHANNEL_PATHS.has(name)) return null;
  if (!/^[a-z0-9_]{3,25}$/.test(name)) return null;
  return name;
}
