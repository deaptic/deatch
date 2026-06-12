import { Show } from "solid-js";
import { user } from "../../lib/stores/users.ts";
import { liveStreams } from "../../lib/stores/channels.ts";

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function ExploreGreeting() {
  const liveCount = () => liveStreams().length;

  return (
    <div class="mb-6 @[620px]:mb-7">
      <h1 class="text-2xl font-semibold tracking-tight text-text @[620px]:text-3xl">
        {timeGreeting()}
        <Show when={user()}>
          {(u) => (
            <>
              , <span class="text-primary">{u().displayName}</span>
            </>
          )}
        </Show>
      </h1>
      <p class="mt-2 text-sm text-text-muted">
        <Show
          when={liveCount() > 0}
          fallback="None of the channels you follow are live right now."
        >
          <span class="font-semibold text-primary">{liveCount()}</span>{" "}
          {liveCount() === 1 ? "channel" : "channels"} you follow{" "}
          {liveCount() === 1 ? "is" : "are"} live right now.
        </Show>
      </p>
    </div>
  );
}
