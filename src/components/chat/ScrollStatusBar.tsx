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
      class="w-full flex items-center gap-2 px-3.5 py-1.5 material-thin rounded-md text-small cursor-pointer transition duration-snap ease-out hover:bg-raised active:scale-99"
    >
      <Show
        when={props.unseen > 0}
        fallback={
          <span class="flex-1 min-w-0 truncate text-left text-ink-soft">
            {t("CHAT_VIEWING_OLDER")}
          </span>
        }
      >
        <span class="size-2 shrink-0 rounded-full bg-accent" />
        <span class="flex-1 min-w-0 truncate text-left font-semibold text-accent-ink">
          {t("CHAT_NEW_MESSAGES", { count: props.unseen })}
        </span>
      </Show>
      <span class="shrink-0 flex items-center gap-1 font-semibold text-ink">
        {t("CHAT_JUMP_TO_LATEST")}
        <ChevronDown class="size-4" />
      </span>
    </button>
  );
}
