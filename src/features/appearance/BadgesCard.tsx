import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { BADGE_CATEGORIES } from "../../shared/badges.ts";
import {
  feedBadges,
  feedShowBadges,
  setFeedBadge,
  setFeedShowBadges,
} from "../preferences/index.ts";
import TypeChips from "./TypeChips.tsx";

export default function BadgesCard() {
  const items = () =>
    BADGE_CATEGORIES.map((c) => ({
      key: c.key,
      label: t(c.label),
      description: t(c.description),
    }));
  return (
    <Card>
      <CardLabel>{t("SETTINGS_MESSAGES_BADGES_TITLE")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_MESSAGES_BADGES_SHOW_LABEL")}
        description={t("SETTINGS_MESSAGES_BADGES_SHOW_DESCRIPTION")}
        keywords={items().map((i) => i.label)}
      >
        <Toggle
          label={t("SETTINGS_MESSAGES_BADGES_SHOW_LABEL")}
          checked={feedShowBadges()}
          onChange={setFeedShowBadges}
        />
      </SettingsRow>
      <TypeChips
        label={t("SETTINGS_MESSAGES_BADGES_SHOW_LABEL")}
        description={t("SETTINGS_MESSAGES_BADGES_SHOW_DESCRIPTION")}
        items={items()}
        isOn={(key) => feedBadges()[key].show !== false}
        disabled={() => !feedShowBadges()}
        onToggle={setFeedBadge}
      />
    </Card>
  );
}
