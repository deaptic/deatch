import { LANGUAGE_NAMES, LANGUAGES, t } from "../../../lib/i18n/index.ts";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import ColorPicker from "../../../kit/ColorPicker.tsx";
import Segmented from "../../../kit/Segmented.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import { DEFAULT_ACCENT_HEX } from "../../../lib/constants/theme.ts";
import { themeOptions } from "./options.ts";
import {
  appearanceAccent,
  appearanceLanguage,
  appearanceTheme,
  setAppearanceAccent,
  setAppearanceLanguage,
  setAppearanceTheme,
} from "../../../lib/stores/preferences.ts";

export default function ThemeCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_THEME_LABEL")}</CardLabel>
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
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_THEME_LABEL")}
        description={t("SETTINGS_APPEARANCE_THEME_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_THEME_LABEL")}
          value={appearanceTheme()}
          options={themeOptions()}
          onChange={setAppearanceTheme}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_ACCENT_LABEL")}
        description={t("SETTINGS_APPEARANCE_ACCENT_DESCRIPTION")}
      >
        <ColorPicker
          swatchColor="var(--color-accent)"
          value={appearanceAccent() ?? DEFAULT_ACCENT_HEX}
          onInput={setAppearanceAccent}
          onReset={() => setAppearanceAccent(null)}
          resetDisabled={appearanceAccent() === null}
        />
      </SettingsRow>
    </Card>
  );
}
