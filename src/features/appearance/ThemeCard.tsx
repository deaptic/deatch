import { t } from "../../shared/i18n/index.ts";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import ColorPicker from "../../kit/ColorPicker.tsx";
import Segmented from "../../kit/Segmented.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";
import { DEFAULT_ACCENT_HEX } from "../../shared/theme.ts";
import { themeOptions } from "./options.ts";
import {
  appearanceAccent,
  appearanceTheme,
  setAppearanceAccent,
  setAppearanceTheme,
} from "../preferences/index.ts";

export default function ThemeCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_THEME_LABEL")}</CardLabel>
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
