import { formatPx, formatWholePercent } from "../../shared/format/units.ts";
import {
  AtSign,
  BadgeCheck,
  CircleUserRound,
  Clock,
  Layers,
  Megaphone,
  SeparatorHorizontal,
  Settings,
  Trash2,
  Type,
  ZoomIn,
} from "lucide-solid";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import {
  canStep,
  FONT_SIZE_STEPS,
  GROUP_SPACING_STEPS,
  ZOOM_STEPS,
} from "../../shared/accessibility.ts";
import {
  appearanceTheme,
  appearanceUiDensity,
  appearanceZoom,
  feedDensity,
  feedFontSize,
  feedGroupMessages,
  feedGroupSpacing,
  feedShowAvatars,
  feedShowBadges,
  feedShowDeletedContent,
  feedShowEvents,
  feedShowTimestamp,
  feedUserShowDisplayName,
  setFeedGroupMessages,
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
  setFeedDensity,
} from "../preferences/index.ts";
import { openSettings } from "../navigation/index.ts";
import Popover from "../../kit/Popover.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Segmented from "../../kit/Segmented.tsx";
import {
  messageLayoutOptions,
  themeOptions,
  uiDensityOptions,
} from "./options.ts";
import { type Component, For, type JSX } from "solid-js";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import MenuStepper from "../../kit/MenuStepper.tsx";
import SectionLabel from "../../kit/SectionLabel.tsx";

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
  disabled?: () => boolean;
}[] = [
  {
    label: "TITLE_BAR_APPEARANCE_AVATARS_LABEL",
    Icon: CircleUserRound,
    on: feedShowAvatars,
    set: setFeedShowAvatars,
  },
  {
    label: "TITLE_BAR_APPEARANCE_TIMESTAMPS_LABEL",
    Icon: Clock,
    on: feedShowTimestamp,
    set: setFeedShowTimestamp,
  },
  {
    label: "TITLE_BAR_APPEARANCE_BADGES_LABEL",
    Icon: BadgeCheck,
    on: feedShowBadges,
    set: setFeedShowBadges,
  },
  {
    label: "TITLE_BAR_APPEARANCE_DISPLAY_NAMES_LABEL",
    Icon: AtSign,
    on: feedUserShowDisplayName,
    set: setFeedUserShowDisplayName,
  },
  {
    label: "TITLE_BAR_APPEARANCE_EVENTS_LABEL",
    Icon: Megaphone,
    on: feedShowEvents,
    set: setFeedShowEvents,
  },
  {
    label: "TITLE_BAR_APPEARANCE_DELETED_LABEL",
    Icon: Trash2,
    on: feedShowDeletedContent,
    set: setFeedShowDeletedContent,
  },
  {
    label: "TITLE_BAR_APPEARANCE_GROUPING_LABEL",
    Icon: Layers,
    on: feedGroupMessages,
    set: setFeedGroupMessages,
    disabled: () => feedDensity() !== "comfortable" || !feedShowAvatars(),
  },
];

function Section(props: { label: string; children: JSX.Element }) {
  return (
    <div class="flex flex-col pb-2">
      <div class="px-2.5 pt-1.5 pb-1">
        <SectionLabel>{props.label}</SectionLabel>
      </div>
      {props.children}
    </div>
  );
}

export default function AppearancePanel(props: Props) {
  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div
        role="menu"
        aria-label={t("TITLE_BAR_APPEARANCE_LABEL")}
        class="w-72 p-1.5 flex flex-col"
      >
        <Section label={t("SETTINGS_APPEARANCE_THEME_LABEL")}>
          <div class="px-1">
            <Segmented
              label={t("SETTINGS_APPEARANCE_THEME_LABEL")}
              value={appearanceTheme()}
              options={themeOptions()}
              onChange={setAppearanceTheme}
              fill
            />
          </div>
        </Section>
        <Section label={t("TITLE_BAR_APPEARANCE_APP_TITLE")}>
          <MenuStepper
            label={t("SETTINGS_APPEARANCE_ZOOM_LABEL")}
            icon={<ZoomIn />}
            value={formatWholePercent(appearanceZoom())}
            lessLabel={t("SETTINGS_KEYBOARD_ZOOM_OUT_LABEL")}
            moreLabel={t("SETTINGS_KEYBOARD_ZOOM_IN_LABEL")}
            canLess={canStep(appearanceZoom(), ZOOM_STEPS, -1)}
            canMore={canStep(appearanceZoom(), ZOOM_STEPS, 1)}
            onStep={stepAppearanceZoom}
          />
          <div class="px-1 pt-1">
            <Segmented
              label={t("SETTINGS_APPEARANCE_DENSITY_LABEL")}
              value={appearanceUiDensity()}
              options={uiDensityOptions()}
              onChange={setAppearanceUiDensity}
              fill
            />
          </div>
        </Section>
        <Section label={t("TITLE_BAR_APPEARANCE_CHAT_TITLE")}>
          <div class="flex flex-col gap-2 px-1 pb-1">
            <Segmented
              label={t("SETTINGS_MESSAGES_LAYOUT_LABEL")}
              value={feedDensity()}
              options={messageLayoutOptions()}
              onChange={setFeedDensity}
              fill
            />
            <div class="flex justify-between">
              <For each={SHOW_TOGGLES}>
                {(toggle) => (
                  <IconButton
                    label={t(toggle.label)}
                    variant="toggle"
                    pressed={toggle.on()}
                    disabled={toggle.disabled?.()}
                    onClick={() => toggle.set(!toggle.on())}
                  >
                    <toggle.Icon class="size-4" />
                  </IconButton>
                )}
              </For>
            </div>
          </div>
          <MenuStepper
            label={t("TITLE_BAR_APPEARANCE_TEXT_SIZE_LABEL")}
            icon={<Type />}
            value={formatPx(feedFontSize())}
            lessLabel={t("TITLE_BAR_APPEARANCE_TEXT_SMALLER_LABEL")}
            moreLabel={t("TITLE_BAR_APPEARANCE_TEXT_LARGER_LABEL")}
            canLess={canStep(feedFontSize(), FONT_SIZE_STEPS, -1)}
            canMore={canStep(feedFontSize(), FONT_SIZE_STEPS, 1)}
            onStep={stepFeedFontSize}
          />
          <MenuStepper
            label={t("TITLE_BAR_APPEARANCE_GROUP_SPACING_LABEL")}
            icon={<SeparatorHorizontal />}
            value={formatPx(feedGroupSpacing())}
            lessLabel={t("TITLE_BAR_APPEARANCE_GROUP_SPACING_LESS_LABEL")}
            moreLabel={t("TITLE_BAR_APPEARANCE_GROUP_SPACING_MORE_LABEL")}
            canLess={canStep(feedGroupSpacing(), GROUP_SPACING_STEPS, -1)}
            canMore={canStep(feedGroupSpacing(), GROUP_SPACING_STEPS, 1)}
            onStep={stepFeedGroupSpacing}
            disabled={feedDensity() !== "comfortable"}
          />
        </Section>
        <MenuDivider />
        <MenuItem
          label={t("TITLE_BAR_APPEARANCE_MORE_SETTINGS_LABEL")}
          icon={<Settings />}
          onClick={() => {
            props.onClose();
            openSettings("messages");
          }}
        />
      </div>
    </Popover>
  );
}
