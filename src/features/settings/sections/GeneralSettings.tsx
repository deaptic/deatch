import { LANGUAGE_NAMES, LANGUAGES, t } from "../../../shared/i18n/index.ts";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import Segmented from "../../../kit/Segmented.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDiscordRichPresence,
  appearanceLanguage,
  setAdvancedAlwaysOnTop,
  setAdvancedAutostart,
  setAdvancedDiscordRichPresence,
  setAppearanceLanguage,
} from "../../preferences/index.ts";

export default function GeneralSettings() {
  return (
    <PageBody title={t("SETTINGS_GENERAL_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_APPEARANCE_LANGUAGE_LABEL")}
          description={t("SETTINGS_APPEARANCE_LANGUAGE_DESCRIPTION")}
        >
          <Segmented
            label={t("SETTINGS_APPEARANCE_LANGUAGE_LABEL")}
            value={appearanceLanguage()}
            options={LANGUAGES.map((language) => ({
              value: language,
              label: LANGUAGE_NAMES[language],
            }))}
            onChange={setAppearanceLanguage}
          />
        </SettingsRow>
      </Card>
      <Card>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_AUTOSTART_LABEL")}
          description={t("SETTINGS_ADVANCED_AUTOSTART_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_AUTOSTART_LABEL")}
            checked={advancedAutostart()}
            onChange={setAdvancedAutostart}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP_LABEL")}
          description={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP_LABEL")}
            checked={advancedAlwaysOnTop()}
            onChange={setAdvancedAlwaysOnTop}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_DISCORD_PRESENCE_LABEL")}
          description={t("SETTINGS_ADVANCED_DISCORD_PRESENCE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_DISCORD_PRESENCE_LABEL")}
            checked={advancedDiscordRichPresence()}
            onChange={setAdvancedDiscordRichPresence}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
