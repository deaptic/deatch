import { Show } from "solid-js";
import { user } from "../../lib/stores/users.ts";
import { liveStreams } from "../../lib/stores/channels.ts";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function ExploreGreeting() {
  const liveCount = () => liveStreams().length;

  return (
    <div class="mb-6">
      <h1 class="text-hero text-ink">
        {timeGreeting()}
        <Show when={user()}>{(u) => <>, {u().displayName}</>}</Show>
      </h1>
      <p class="mt-2 text-body text-ink-soft max-w-prose">
        <Show
          when={liveCount() > 0}
          fallback="Nobody you follow is live right now. Search for a channel, or browse what's on."
        >
          {liveCount() === 1
            ? "One channel you follow is live. "
            : `${liveCount()} channels you follow are live. `}
          Find a chat to settle into.
        </Show>
      </p>
    </div>
  );
}
