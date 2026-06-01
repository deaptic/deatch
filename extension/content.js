const DEBUG = false;
const log = DEBUG ? console.log.bind(console, "[deatch]") : () => {};

const NON_CHANNEL_PATHS = new Set([
  "",
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

  const first = seg[0].toLowerCase();
  if (NON_CHANNEL_PATHS.has(first)) return null;

  // Twitch usernames: 4-25 chars, alphanumeric + underscore.
  if (!/^[a-z0-9_]{3,25}$/.test(first)) return null;

  return first;
}

let lastChannel = null;

function report() {
  const ch = channelFromUrl(location.href);
  if (ch === lastChannel) return;
  lastChannel = ch;
  log("detected channel:", ch);
  chrome.runtime.sendMessage({ type: "channel-changed", channel: ch }).catch(
    () => {},
  );
}

report();

// Twitch is an SPA — patch history methods so we catch pushState/replaceState.
for (const m of ["pushState", "replaceState"]) {
  const orig = history[m];
  history[m] = function () {
    const r = orig.apply(this, arguments);
    queueMicrotask(report);
    return r;
  };
}
addEventListener("popstate", report);

// Backstop: title mutations fire reliably after the SPA settles a route,
// covering cases where pushState patching misses.
new MutationObserver(report).observe(
  document.querySelector("title") || document.head,
  {
    subtree: true,
    characterData: true,
    childList: true,
  },
);
