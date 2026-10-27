import { Show } from "solid-js";
import { user } from "../../lib/stores/users.ts";
import { liveStreams } from "../../lib/stores/channels.ts";
import { type MessageKey, t } from "../../lib/i18n/index.ts";

function timeGreeting(): MessageKey {
  const hour = new Date().getHours();
  if (hour < 5) return "EXPLORE_GREETING_NIGHT";
  if (hour < 12) return "EXPLORE_GREETING_MORNING";
  if (hour < 18) return "EXPLORE_GREETING_AFTERNOON";
  return "EXPLORE_GREETING_EVENING";
}

export default function ExploreGreeting() {
  const liveCount = () => liveStreams().length;

  return (
    <div class="mb-6">
      <h1 class="text-hero text-ink">
        <Show when={user()} fallback={t(timeGreeting())}>
          {(u) =>
            t("EXPLORE_GREETING_NAMED", {
              greeting: t(timeGreeting()),
              name: u().displayName,
            })
          }
        </Show>
      </h1>
      <p class="mt-2 text-body text-ink-soft max-w-prose">
        <Show when={liveCount() > 0} fallback={t("EXPLORE_NONE_LIVE")}>
          {t("EXPLORE_LIVE_COUNT", { count: liveCount() })}
        </Show>
      </p>
    </div>
  );
}
