import { t } from "../../shared/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { BADGE_CATEGORIES } from "../../lib/constants/badges.ts";
import {
  feedBadges,
  feedShowBadges,
  setFeedBadge,
  setFeedShowBadges,
} from "../preferences/index.ts";

export default function BadgesCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_BADGES_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_BADGES_SHOW_LABEL")}
        description={t("SETTINGS_APPEARANCE_BADGES_SHOW_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_BADGES_SHOW_LABEL")}
          checked={feedShowBadges()}
          onChange={setFeedShowBadges}
        />
      </SettingsRow>
      <For each={BADGE_CATEGORIES}>
        {(c) => (
          <SettingsRow label={t(c.label)} description={t(c.description)}>
            <Toggle
              label={t(c.label)}
              checked={feedBadges()[c.key].show !== false}
              disabled={!feedShowBadges()}
              onChange={(v) => setFeedBadge(c.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
