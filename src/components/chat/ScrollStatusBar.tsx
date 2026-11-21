import { ChevronDown } from "lucide-solid";
import { Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { CAPTION_FRAME } from "../ui/ComposerCaption.tsx";

type Props = {
  unseen: number;
  onJump: () => void;
};

export default function ScrollStatusBar(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onJump}
      class={`w-full ${CAPTION_FRAME} cursor-pointer pressable hover:bg-raised`}
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
      <span class="shrink-0 px-2.5 flex items-center gap-1 font-semibold text-ink">
        {t("CHAT_JUMP_TO_LATEST")}
        <ChevronDown class="size-4" />
      </span>
    </button>
  );
}
