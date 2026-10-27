import {
  AtSign,
  BadgeCheck,
  CircleUserRound,
  Clock,
  Megaphone,
  Rows2,
  SeparatorHorizontal,
  Settings,
  Trash2,
  Type,
} from "lucide-solid";
import { t } from "../../lib/i18n/index.ts";
import {
  FONT_SIZE_STOPS,
  GROUP_SPACING_STOPS,
} from "../../lib/constants/accessibility.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import {
  feedDensity,
  feedFontSize,
  feedGroupSpacing,
  feedShowAvatars,
  feedShowBadges,
  feedShowDeletedContent,
  feedShowEvents,
  feedShowTimestamp,
  feedUserShowDisplayName,
  setFeedShowAvatars,
  setFeedShowBadges,
  setFeedShowDeletedContent,
  setFeedShowEvents,
  setFeedShowTimestamp,
  setFeedUserShowDisplayName,
  stepFeedFontSize,
  stepFeedGroupSpacing,
  toggleFeedDensity,
} from "../../lib/stores/preferences.ts";
import { openSettings } from "../../lib/stores/view.ts";
import ComposerPanel from "../ui/ComposerPanel.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import MenuStepper from "../ui/MenuStepper.tsx";

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
      <MenuItem
        label={t("CHAT_APPEARANCE_DISPLAY_NAMES")}
        icon={<AtSign />}
        active={feedUserShowDisplayName()}
        onClick={() => setFeedUserShowDisplayName(!feedUserShowDisplayName())}
      />
      <MenuDivider />
      <MenuItem
        label={t("CHAT_APPEARANCE_EVENTS")}
        icon={<Megaphone />}
        active={feedShowEvents()}
        onClick={() => setFeedShowEvents(!feedShowEvents())}
      />
      <MenuItem
        label={t("CHAT_APPEARANCE_DELETED")}
        icon={<Trash2 />}
        active={feedShowDeletedContent()}
        onClick={() => setFeedShowDeletedContent(!feedShowDeletedContent())}
      />
      <MenuDivider />
      <MenuStepper
        label={t("CHAT_APPEARANCE_TEXT_SIZE")}
        icon={<Type />}
        value={`${feedFontSize()}px`}
        lessLabel={t("CHAT_APPEARANCE_TEXT_SMALLER")}
        moreLabel={t("CHAT_APPEARANCE_TEXT_LARGER")}
        canLess={feedFontSize() > FONT_SIZE_STOPS[0]}
        canMore={feedFontSize() < FONT_SIZE_STOPS.at(-1)!}
        onStep={stepFeedFontSize}
      />
      <MenuStepper
        label={t("CHAT_APPEARANCE_GROUP_SPACING")}
        icon={<SeparatorHorizontal />}
        value={`${feedGroupSpacing()}px`}
        lessLabel={t("CHAT_APPEARANCE_GROUP_SPACING_LESS")}
        moreLabel={t("CHAT_APPEARANCE_GROUP_SPACING_MORE")}
        canLess={feedGroupSpacing() > GROUP_SPACING_STOPS[0]}
        canMore={feedGroupSpacing() < GROUP_SPACING_STOPS.at(-1)!}
        onStep={stepFeedGroupSpacing}
        disabled={feedDensity() !== "comfortable"}
      />
      <MenuDivider />
      <MenuItem
        label={t("CHAT_APPEARANCE_MORE_SETTINGS")}
        icon={<Settings />}
        onClick={() => {
          props.onClose();
          openSettings("appearance");
        }}
      />
    </ComposerPanel>
  );
}
