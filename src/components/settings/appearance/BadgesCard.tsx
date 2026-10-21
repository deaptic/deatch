import { t } from "../../../lib/i18n/index.ts";
import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import { BADGE_CATEGORIES } from "../../../lib/constants.ts";
import { feedBadges, setFeedBadge } from "../../../lib/stores/preferences.ts";

export default function BadgesCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_BADGES")}</CardLabel>
      <For each={BADGE_CATEGORIES}>
        {(c) => (
          <SettingsRow label={t(c.label)} description={t(c.description)}>
            <Toggle
              label={t(c.label)}
              checked={feedBadges()[c.key]?.show !== false}
              onChange={(v) => setFeedBadge(c.key, v)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
