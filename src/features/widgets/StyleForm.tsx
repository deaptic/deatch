import { For, type JSX, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { t, type MessageKey } from "../../shared/i18n/index.ts";
import { DEFAULT_ACCENT_HEX } from "../../shared/theme.ts";
import { DENSITIES } from "../../shared/density.ts";
import { formatPx, formatWholePercent } from "../../shared/format/units.ts";
import Chip from "../../kit/Chip.tsx";
import SearchPicker from "../../kit/SearchPicker.tsx";
import Avatar from "../../kit/Avatar.tsx";
import ColorPicker from "../../kit/ColorPicker.tsx";
import FormRow from "../../kit/FormRow.tsx";
import Segmented from "../../kit/Segmented.tsx";
import Slider from "../../kit/Slider.tsx";
import Text from "../../kit/Text.tsx";
import Toggle from "../../kit/Toggle.tsx";
import {
  type ChatStyle,
  WIDGET_ALIGNS,
  WIDGET_FADE_SECONDS,
  WIDGET_LINES,
  WIDGET_SIDES,
  WIDGET_RANGES,
  WIDGET_WIDTHS,
} from "../preferences/index.ts";
import { avatarZoom } from "../../shared/avatar.ts";
import { channelSearch } from "../channels/index.ts";
import { userKey, withUser } from "./model.ts";

type Change = (change: Partial<ChatStyle>) => void;
type Props = { chatStyle: ChatStyle; onChange: Change };

const NAME_POSITIONS: Record<ChatStyle["density"], MessageKey> = {
  compact: "SETTINGS_WIDGETS_NAME_INLINE_LABEL",
  comfortable: "SETTINGS_WIDGETS_NAME_ABOVE_LABEL",
};

const WIDTHS: Record<ChatStyle["width"], MessageKey> = {
  fit: "SETTINGS_WIDGETS_WIDTH_FIT_LABEL",
  full: "SETTINGS_WIDGETS_WIDTH_FULL_LABEL",
};

const NEWEST: Record<ChatStyle["newest"], MessageKey> = {
  bottom: "SETTINGS_WIDGETS_NEWEST_BOTTOM_LABEL",
  top: "SETTINGS_WIDGETS_NEWEST_TOP_LABEL",
};

const FILL: Record<ChatStyle["fill"], MessageKey> = {
  bottom: "SETTINGS_WIDGETS_FILL_BOTTOM_LABEL",
  top: "SETTINGS_WIDGETS_FILL_TOP_LABEL",
};

const ALIGNS: Record<ChatStyle["align"], MessageKey> = {
  left: "SETTINGS_WIDGETS_ALIGN_LEFT_LABEL",
  right: "SETTINGS_WIDGETS_ALIGN_RIGHT_LABEL",
};

function ChoiceRow<T extends string | number>(props: {
  label: string;
  description?: string;
  values: readonly T[];
  value: T;
  format: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <FormRow label={props.label} description={props.description}>
      <Segmented
        label={props.label}
        value={String(props.value)}
        options={props.values.map((value) => ({
          value: String(value),
          label: props.format(value),
        }))}
        onChange={(v) => {
          const value = props.values.find((option) => String(option) === v);
          if (value !== undefined) props.onChange(value);
        }}
      />
    </FormRow>
  );
}

function RangeRow(props: {
  label: string;
  description?: string;
  range: { min: number; max: number; step: number };
  value: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <FormRow label={props.label} description={props.description}>
      <div class="flex items-center gap-3 w-64">
        <Slider
          label={props.label}
          value={props.value}
          min={props.range.min}
          max={props.range.max}
          step={props.range.step}
          format={props.format}
          onChange={props.onChange}
        />
        <Text
          align="right"
          size="sm"
          tabular
          tone="primary"
          class="w-12 shrink-0"
        >
          {props.format(props.value)}
        </Text>
      </div>
    </FormRow>
  );
}

function ColorRow(props: {
  label: string;
  description?: string;
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  return (
    <FormRow label={props.label} description={props.description}>
      <ColorPicker
        swatchColor={props.value ?? "transparent"}
        value={props.value ?? DEFAULT_ACCENT_HEX}
        onChange={props.onChange}
        onReset={() => props.onChange(null)}
        resetDisabled={props.value === null}
      />
    </FormRow>
  );
}

function ToggleRow(props: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormRow label={props.label} description={props.description}>
      <Toggle
        label={props.label}
        checked={props.checked}
        disabled={props.disabled}
        onChange={props.onChange}
      />
    </FormRow>
  );
}

function Section(props: { children: JSX.Element }) {
  return <div class="flex flex-col">{props.children}</div>;
}

function ContentSection(props: Props) {
  return (
    <Section>
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_NAME_POSITION_LABEL")}
        values={DENSITIES}
        value={props.chatStyle.density}
        format={(density) => t(NAME_POSITIONS[density])}
        onChange={(density) => props.onChange({ density })}
      />
      <ToggleRow
        label={t("SETTINGS_WIDGETS_AVATARS_LABEL")}
        description={t("SETTINGS_WIDGETS_AVATARS_DESCRIPTION")}
        checked={props.chatStyle.showAvatars}
        disabled={props.chatStyle.density !== "comfortable"}
        onChange={(showAvatars) => props.onChange({ showAvatars })}
      />
      <ToggleRow
        label={t("SETTINGS_WIDGETS_BADGES_LABEL")}
        checked={props.chatStyle.showBadges}
        onChange={(showBadges) => props.onChange({ showBadges })}
      />
      <ToggleRow
        label={t("SETTINGS_WIDGETS_TIMESTAMPS_LABEL")}
        checked={props.chatStyle.showTimestamp}
        onChange={(showTimestamp) => props.onChange({ showTimestamp })}
      />
      <ToggleRow
        label={t("SETTINGS_WIDGETS_BOLD_NAMES_LABEL")}
        checked={props.chatStyle.boldNames}
        onChange={(boldNames) => props.onChange({ boldNames })}
      />
    </Section>
  );
}

function BehaviourSection(props: Props) {
  const hide = (name: string) =>
    props.onChange({
      hiddenUsers: withUser(props.chatStyle.hiddenUsers, name),
    });
  const show = (name: string) =>
    props.onChange({
      hiddenUsers: props.chatStyle.hiddenUsers.filter((n) => n !== name),
    });

  return (
    <Section>
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_LINES_LABEL")}
        values={WIDGET_LINES}
        value={props.chatStyle.maxLines}
        format={String}
        onChange={(maxLines) => props.onChange({ maxLines })}
      />
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_FADE_LABEL")}
        values={WIDGET_FADE_SECONDS}
        value={props.chatStyle.fadeAfter}
        format={(count) => t("SETTINGS_WIDGETS_FADE_VALUE", { count })}
        onChange={(fadeAfter) => props.onChange({ fadeAfter })}
      />
      <ToggleRow
        label={t("SETTINGS_WIDGETS_HIDE_COMMANDS_LABEL")}
        description={t("SETTINGS_WIDGETS_HIDE_COMMANDS_DESCRIPTION")}
        checked={props.chatStyle.hideCommands}
        onChange={(hideCommands) => props.onChange({ hideCommands })}
      />
      <FormRow
        label={t("SETTINGS_WIDGETS_HIDDEN_USERS_LABEL")}
        layout="stacked"
      >
        <SearchPicker
          floating
          clearOnSelect
          label={t("SETTINGS_WIDGETS_HIDDEN_USERS_PLACEHOLDER")}
          placeholder={t("SETTINGS_WIDGETS_HIDDEN_USERS_PLACEHOLDER")}
          search={(query) =>
            channelSearch.find(
              query,
              (c) =>
                !props.chatStyle.hiddenUsers.includes(userKey(c.user.login)),
            )
          }
          name={(c) => c.user.displayName}
          picture={(c) => (
            <Avatar
              src={c.profileImageUrl}
              zoom={avatarZoom(c.profileImageUrl)}
              alt={c.user.displayName}
              size="xs"
            />
          )}
          onSelect={(c) => {
            if (c) hide(c.user.login);
          }}
        />
        <Show when={props.chatStyle.hiddenUsers.length > 0}>
          <div class="flex flex-wrap gap-1.5">
            <For each={props.chatStyle.hiddenUsers}>
              {(name) => <Chip label={name} onRemove={() => show(name)} />}
            </For>
          </div>
        </Show>
      </FormRow>
    </Section>
  );
}

function StyleSection(props: Props) {
  return (
    <Section>
      <ColorRow
        label={t("SETTINGS_WIDGETS_BACKGROUND_COLOR_LABEL")}
        value={props.chatStyle.backgroundColor}
        onChange={(backgroundColor) => props.onChange({ backgroundColor })}
      />
      <RangeRow
        label={t("SETTINGS_WIDGETS_BACKGROUND_LABEL")}
        range={WIDGET_RANGES.backgroundOpacity}
        value={props.chatStyle.backgroundOpacity}
        format={formatWholePercent}
        onChange={(backgroundOpacity) => props.onChange({ backgroundOpacity })}
      />
      <RangeRow
        label={t("SETTINGS_WIDGETS_RADIUS_LABEL")}
        range={WIDGET_RANGES.radius}
        value={props.chatStyle.radius}
        format={formatPx}
        onChange={(radius) => props.onChange({ radius })}
      />
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_WIDTH_LABEL")}
        values={WIDGET_WIDTHS}
        value={props.chatStyle.width}
        format={(width) => t(WIDTHS[width])}
        onChange={(width) => props.onChange({ width })}
      />
      <ColorRow
        label={t("SETTINGS_WIDGETS_NAME_COLOR_LABEL")}
        description={t("SETTINGS_WIDGETS_NAME_COLOR_DESCRIPTION")}
        value={props.chatStyle.nameColor}
        onChange={(nameColor) => props.onChange({ nameColor })}
      />
      <ColorRow
        label={t("SETTINGS_WIDGETS_TEXT_COLOR_LABEL")}
        value={props.chatStyle.textColor}
        onChange={(textColor) => props.onChange({ textColor })}
      />
    </Section>
  );
}

function SizeSection(props: Props) {
  return (
    <Section>
      <RangeRow
        label={t("SETTINGS_WIDGETS_SCALE_LABEL")}
        description={t("SETTINGS_WIDGETS_SCALE_DESCRIPTION")}
        range={WIDGET_RANGES.scale}
        value={props.chatStyle.scale}
        format={formatWholePercent}
        onChange={(scale) => props.onChange({ scale })}
      />
      <RangeRow
        label={t("SETTINGS_WIDGETS_TEXT_SIZE_LABEL")}
        description={t("SETTINGS_WIDGETS_TEXT_SIZE_DESCRIPTION")}
        range={WIDGET_RANGES.textSize}
        value={props.chatStyle.textSize}
        format={formatPx}
        onChange={(textSize) => props.onChange({ textSize })}
      />
      <RangeRow
        label={t("SETTINGS_WIDGETS_EDGE_LABEL")}
        range={WIDGET_RANGES.edge}
        value={props.chatStyle.edge}
        format={formatPx}
        onChange={(edge) => props.onChange({ edge })}
      />
      <RangeRow
        label={t("SETTINGS_WIDGETS_GAP_LABEL")}
        range={WIDGET_RANGES.gap}
        value={props.chatStyle.gap}
        format={formatPx}
        onChange={(gap) => props.onChange({ gap })}
      />
    </Section>
  );
}

function PositionSection(props: Props) {
  return (
    <Section>
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_NEWEST_LABEL")}
        values={WIDGET_SIDES}
        value={props.chatStyle.newest}
        format={(side) => t(NEWEST[side])}
        onChange={(newest) => props.onChange({ newest })}
      />
      <Show when={props.chatStyle.newest === "bottom"}>
        <ChoiceRow
          label={t("SETTINGS_WIDGETS_FILL_LABEL")}
          description={t("SETTINGS_WIDGETS_FILL_DESCRIPTION")}
          values={WIDGET_SIDES}
          value={props.chatStyle.fill}
          format={(side) => t(FILL[side])}
          onChange={(fill) => props.onChange({ fill })}
        />
      </Show>
      <ChoiceRow
        label={t("SETTINGS_WIDGETS_ALIGN_LABEL")}
        values={WIDGET_ALIGNS}
        value={props.chatStyle.align}
        format={(align) => t(ALIGNS[align])}
        onChange={(align) => props.onChange({ align })}
      />
    </Section>
  );
}

export const TABS = [
  "content",
  "behaviour",
  "style",
  "size",
  "position",
] as const;
export type Tab = (typeof TABS)[number];

export const TAB_LABELS: Record<Tab, MessageKey> = {
  content: "SETTINGS_WIDGETS_CONTENT_LABEL",
  behaviour: "SETTINGS_WIDGETS_BEHAVIOUR_LABEL",
  style: "SETTINGS_WIDGETS_STYLE_LABEL",
  size: "SETTINGS_WIDGETS_SIZE_LABEL",
  position: "SETTINGS_WIDGETS_POSITION_LABEL",
};

const SECTIONS: Record<Tab, (props: Props) => JSX.Element> = {
  content: ContentSection,
  behaviour: BehaviourSection,
  style: StyleSection,
  size: SizeSection,
  position: PositionSection,
};

export default function StyleForm(props: Props & { tab: Tab }) {
  return (
    <Dynamic
      component={SECTIONS[props.tab]}
      chatStyle={props.chatStyle}
      onChange={props.onChange}
    />
  );
}
