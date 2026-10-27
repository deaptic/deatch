import {
  BadgeCheck,
  CircleUserRound,
  Clock,
  Minus,
  Plus,
  Rows2,
  Type,
} from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";
import { FONT_SIZE_STOPS } from "../../lib/constants/accessibility.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import {
  feedDensity,
  feedFontSize,
  feedShowAvatars,
  feedShowBadges,
  feedShowTimestamp,
  setFeedShowAvatars,
  setFeedShowBadges,
  setFeedShowTimestamp,
  stepFeedFontSize,
  toggleFeedDensity,
} from "../../lib/stores/preferences.ts";
import ComposerPanel from "../ui/ComposerPanel.tsx";
import IconButton from "../ui/IconButton.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";

type Props = {
  onClose: () => void;
  anchorEl?: HTMLElement | null;
};

/// Chat appearance switches opened from the composer. It stays open so
/// several can be flipped in a row.
export default function AppearancePanel(props: Props) {
  return (
    <ComposerPanel
      label={t("CHAT_APPEARANCE")}
      anchorEl={props.anchorEl}
      onClose={props.onClose}
      size="menu"
    >
      <MenuItem
        label={t("CHAT_APPEARANCE_SPACIOUS")}
        icon={<Rows2 />}
        active={feedDensity() === "comfortable"}
        shortcut={shortcuts.keyFor("feed::toggleDensity")}
        onClick={toggleFeedDensity}
      />
      <MenuItem
        label={t("CHAT_APPEARANCE_AVATARS")}
        icon={<CircleUserRound />}
        active={feedShowAvatars()}
        onClick={() => setFeedShowAvatars(!feedShowAvatars())}
      />
      <MenuItem
        label={t("CHAT_APPEARANCE_TIMESTAMPS")}
        icon={<Clock />}
        active={feedShowTimestamp()}
        onClick={() => setFeedShowTimestamp(!feedShowTimestamp())}
      />
      <MenuItem
        label={t("CHAT_APPEARANCE_BADGES")}
        icon={<BadgeCheck />}
        active={feedShowBadges()}
        onClick={() => setFeedShowBadges(!feedShowBadges())}
      />
      <MenuDivider />
      <div class="h-control-md flex items-center gap-2.5 pl-2.5 text-body text-ink">
        <span class="shrink-0 w-4 grid place-items-center text-ink-soft [&>svg]:size-4">
          <Type />
        </span>
        <span class="truncate">{t("CHAT_APPEARANCE_TEXT_SIZE")}</span>
        <span class="ml-auto flex items-center gap-1">
          <IconButton
            label={t("CHAT_APPEARANCE_TEXT_SMALLER")}
            size="sm"
            disabled={feedFontSize() <= FONT_SIZE_STOPS[0]}
            onClick={() => stepFeedFontSize(-1)}
          >
            <Minus class="size-4" />
          </IconButton>
          <span class="w-10 text-center text-small text-ink-soft tabular-nums">
            {`${feedFontSize()}px`}
          </span>
          <IconButton
            label={t("CHAT_APPEARANCE_TEXT_LARGER")}
            size="sm"
            disabled={feedFontSize() >= FONT_SIZE_STOPS.at(-1)!}
            onClick={() => stepFeedFontSize(1)}
          >
            <Plus class="size-4" />
          </IconButton>
        </span>
      </div>
    </ComposerPanel>
  );
}
