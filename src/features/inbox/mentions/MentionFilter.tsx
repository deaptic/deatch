import { SlidersHorizontal } from "lucide-solid";
import { For, Show } from "solid-js";
import { type MessageKey, t } from "../../../shared/i18n/index.ts";
import { MENTION_KINDS, type MentionKind } from "../../../shared/mentions.ts";
import Dot from "../../../kit/Dot.tsx";
import IconMenuButton from "../../../kit/IconMenuButton.tsx";
import MenuItem from "../../../kit/MenuItem.tsx";
import { inboxShows, setInboxShows } from "../../preferences/index.ts";

const LABELS: Record<MentionKind, MessageKey> = {
  reply: "INBOX_FILTER_REPLY_LABEL",
  mention: "INBOX_FILTER_MENTION_LABEL",
  keyword: "INBOX_FILTER_KEYWORD_LABEL",
};

export default function MentionFilter() {
  const hidden = () => MENTION_KINDS.filter((k) => !inboxShows(k));
  return (
    <IconMenuButton
      align="end"
      label={t("INBOX_FILTER_LABEL")}
      icon={<SlidersHorizontal class="size-4" />}
      marker={
        <Show when={hidden().length}>
          <span class="pointer-events-none absolute top-1 right-1 flex">
            <Dot tone="accent" />
          </span>
        </Show>
      }
    >
      <For each={MENTION_KINDS}>
        {(kind) => (
          <MenuItem
            label={t(LABELS[kind])}
            checked={inboxShows(kind)}
            onClick={() => setInboxShows(kind, !inboxShows(kind))}
          />
        )}
      </For>
    </IconMenuButton>
  );
}
