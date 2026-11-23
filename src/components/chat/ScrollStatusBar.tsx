import { ChevronDown } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  unseen: number;
  onJump: () => void;
};

export default function ScrollStatusBar(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onJump}
      class="w-full flex items-center gap-2 pl-4 pr-1.5 py-1 min-h-strip min-w-0 text-small bg-surface cursor-pointer transition-colors duration-snap hover:bg-raised"
    >
      <Show
        when={props.unseen > 0}
        fallback={
          <span class="flex-1 min-w-0 truncate text-left text-ink-soft">
            {t("FEED_VIEWING_OLDER_STATUS")}
          </span>
        }
      >
        <span class="size-2 shrink-0 rounded-full bg-accent" />
        <span class="flex-1 min-w-0 truncate text-left font-semibold text-accent-ink">
          {t("FEED_UNREAD_COUNT_LABEL", { count: props.unseen })}
        </span>
      </Show>
      <span class="shrink-0 px-2.5 flex items-center gap-1 font-semibold text-ink">
        {t("FEED_JUMP_TO_LATEST_LABEL")}
        <ChevronDown class="size-4" />
      </span>
    </button>
  );
}
