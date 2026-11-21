import { formatPx, formatWholePercent } from "../../lib/format/units.ts";
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
  ZoomIn,
} from "lucide-solid";
import { type MessageKey, t } from "../../lib/i18n/index.ts";
import {
  canStep,
  FONT_SIZE_STOPS,
  GROUP_SPACING_STOPS,
  ZOOM_STOPS,
} from "../../lib/constants/accessibility.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import {
  appearanceTheme,
  appearanceUiDensity,
  appearanceZoom,
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
  setAppearanceTheme,
  setAppearanceUiDensity,
  setFeedUserShowDisplayName,
  stepAppearanceZoom,
  stepFeedFontSize,
  stepFeedGroupSpacing,
  toggleFeedDensity,
} from "../../lib/stores/preferences.ts";
import { openSettings } from "../../lib/stores/view.ts";
import Popover from "../ui/Popover.tsx";
import IconButton from "../ui/IconButton.tsx";
import Segmented from "../ui/Segmented.tsx";
import {
  themeOptions,
  uiDensityOptions,
} from "../settings/appearance/options.ts";
import { type Component, For, type JSX } from "solid-js";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import MenuStepper from "../ui/MenuStepper.tsx";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

const SHOW_TOGGLES: {
  label: MessageKey;
  Icon: Component<{ class?: string }>;
  on: () => boolean;
  set: (on: boolean) => void;
}[] = [
  {
    label: "CHAT_APPEARANCE_AVATARS",
    Icon: CircleUserRound,
    on: feedShowAvatars,
    set: setFeedShowAvatars,
  },
  {
    label: "CHAT_APPEARANCE_TIMESTAMPS",
    Icon: Clock,
    on: feedShowTimestamp,
    set: setFeedShowTimestamp,
  },
  {
    label: "CHAT_APPEARANCE_BADGES",
    Icon: BadgeCheck,
    on: feedShowBadges,
    set: setFeedShowBadges,
  },
  {
    label: "CHAT_APPEARANCE_DISPLAY_NAMES",
    Icon: AtSign,
    on: feedUserShowDisplayName,
    set: setFeedUserShowDisplayName,
  },
  {
    label: "CHAT_APPEARANCE_EVENTS",
    Icon: Megaphone,
    on: feedShowEvents,
    set: setFeedShowEvents,
  },
  {
    label: "CHAT_APPEARANCE_DELETED",
    Icon: Trash2,
    on: feedShowDeletedContent,
    set: setFeedShowDeletedContent,
  },
];

function Section(props: { label: string; children: JSX.Element }) {
  return (
    <div class="flex flex-col pb-2">
      <span class="px-2.5 pt-1.5 pb-1 text-micro uppercase text-ink-faint">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

export default function AppearancePanel(props: Props) {
  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div
        role="menu"
        aria-label={t("CHAT_APPEARANCE")}
        class="w-72 p-1.5 flex flex-col"
      >
        <Section label={t("SETTINGS_APPEARANCE_THEME")}>
          <div class="px-1">
            <Segmented
              label={t("SETTINGS_APPEARANCE_THEME")}
              value={appearanceTheme()}
              options={themeOptions()}
              onChange={setAppearanceTheme}
              fill
            />
          </div>
        </Section>
        <Section label={t("CHAT_APPEARANCE_SECTION_APP")}>
          <MenuStepper
            label={t("SETTINGS_APPEARANCE_ZOOM")}
            icon={<ZoomIn />}
            value={formatWholePercent(appearanceZoom())}
            lessLabel={t("SETTINGS_KEYBOARD_ZOOM_OUT")}
            moreLabel={t("SETTINGS_KEYBOARD_ZOOM_IN")}
            canLess={canStep(appearanceZoom(), ZOOM_STOPS, -1)}
            canMore={canStep(appearanceZoom(), ZOOM_STOPS, 1)}
            onStep={stepAppearanceZoom}
          />
          <div class="px-1 pt-1">
            <Segmented
              label={t("SETTINGS_APPEARANCE_DENSITY")}
              value={appearanceUiDensity()}
              options={uiDensityOptions()}
              onChange={setAppearanceUiDensity}
              fill
            />
          </div>
        </Section>
        <Section label={t("CHAT_APPEARANCE_SECTION_CHAT")}>
          <div class="flex justify-between px-1 pb-1">
            <For each={SHOW_TOGGLES}>
              {(toggle) => (
                <IconButton
                  label={t(toggle.label)}
                  variant="toggle"
                  pressed={toggle.on()}
                  onClick={() => toggle.set(!toggle.on())}
                >
                  <toggle.Icon class="size-4" />
                </IconButton>
              )}
            </For>
          </div>
          <MenuItem
            label={t("CHAT_APPEARANCE_SPACIOUS")}
            icon={<Rows2 />}
            active={feedDensity() === "comfortable"}
            shortcut={shortcuts.keyFor("feed::toggleDensity")}
            onClick={toggleFeedDensity}
          />
          <MenuStepper
            label={t("CHAT_APPEARANCE_TEXT_SIZE")}
            icon={<Type />}
            value={formatPx(feedFontSize())}
            lessLabel={t("CHAT_APPEARANCE_TEXT_SMALLER")}
            moreLabel={t("CHAT_APPEARANCE_TEXT_LARGER")}
            canLess={canStep(feedFontSize(), FONT_SIZE_STOPS, -1)}
            canMore={canStep(feedFontSize(), FONT_SIZE_STOPS, 1)}
            onStep={stepFeedFontSize}
          />
          <MenuStepper
            label={t("CHAT_APPEARANCE_GROUP_SPACING")}
            icon={<SeparatorHorizontal />}
            value={formatPx(feedGroupSpacing())}
            lessLabel={t("CHAT_APPEARANCE_GROUP_SPACING_LESS")}
            moreLabel={t("CHAT_APPEARANCE_GROUP_SPACING_MORE")}
            canLess={canStep(feedGroupSpacing(), GROUP_SPACING_STOPS, -1)}
            canMore={canStep(feedGroupSpacing(), GROUP_SPACING_STOPS, 1)}
            onStep={stepFeedGroupSpacing}
            disabled={feedDensity() !== "comfortable"}
          />
        </Section>
        <MenuDivider />
        <MenuItem
          label={t("CHAT_APPEARANCE_MORE_SETTINGS")}
          icon={<Settings />}
          onClick={() => {
            props.onClose();
            openSettings("appearance");
          }}
        />
      </div>
    </Popover>
  );
}
