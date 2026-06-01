import { watchConnected, watchMode } from "../../lib/stores/watch.ts";

function watchSeen(): boolean {
  try {
    return localStorage.getItem("deatch_watch_seen") === "1";
  } catch {
    return false;
  }
}

export default function EmptyState() {
  const message = () => {
    if (watchMode() === null) return "Select a channel to view chat";
    if (watchConnected()) return "Open a Twitch channel in your browser.";
    if (watchSeen()) {
      return "Waiting for your browser — open Firefox with a Twitch tab.";
    }
    return "Install the Deatch Link extension, then open a Twitch channel.";
  };
  return (
    <div class="flex items-center justify-center flex-1 px-6">
      <p class="text-text-muted text-sm text-center max-w-xs">{message()}</p>
    </div>
  );
}
