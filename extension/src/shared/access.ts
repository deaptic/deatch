import { log } from "./log.ts";

const manifest = () => chrome.runtime.getManifest();
const twitchOrigins = () => manifest().host_permissions ?? [];

async function showAccess() {
  const allowed = await chrome.permissions.contains({
    origins: twitchOrigins(),
  });
  await chrome.action.setPopup({
    popup: allowed ? (manifest().action?.default_popup ?? "") : "",
  });
  await chrome.action.setBadgeText({ text: allowed ? "" : "!" });
}

function refresh() {
  showAccess().catch((error: unknown) => {
    log.warn("access state not shown", error);
  });
}

export function startAccess(onGranted: () => void) {
  chrome.action.onClicked.addListener(() => {
    chrome.permissions
      .request({ origins: twitchOrigins() })
      .catch((error: unknown) =>
        log.warn("Twitch access not requested", error),
      );
  });
  chrome.permissions.onAdded.addListener(() => {
    refresh();
    onGranted();
  });
  chrome.permissions.onRemoved.addListener(refresh);
  refresh();
}
