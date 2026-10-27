import { t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import { BADGE_CATEGORIES } from "../../../lib/constants.ts";
import {
  feedBadges,
  feedShowBadges,
  setFeedBadge,
  setFeedShowBadges,
} from "../../../lib/stores/preferences.ts";

export default function BadgesCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_BADGES")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_BADGES_SHOW")}
        description={t("SETTINGS_APPEARANCE_BADGES_SHOW_DESCRIPTION")}
      >
        <Toggle
          label={t("SETTINGS_APPEARANCE_BADGES_SHOW")}
          checked={feedShowBadges()}
          onChange={setFeedShowBadges}
        />
      </SettingsRow>
      <For each={BADGE_CATEGORIES}>
        {(c) => (
          <SettingsRow label={t(c.label)} description={t(c.description)}>
            <Toggle
              label={t(c.label)}
              checked={feedBadges()[c.key]?.show !== false}
              disabled={!feedShowBadges()}
              onChange={(v) => setFeedBadge(c.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
