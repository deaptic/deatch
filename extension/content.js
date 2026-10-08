const DEBUG = false;
const log = DEBUG ? console.log.bind(console, "[deatch]") : () => {};

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
