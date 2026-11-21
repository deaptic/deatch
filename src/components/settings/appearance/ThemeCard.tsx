import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Segmented from "../../ui/Segmented.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import { DEFAULT_ACCENT_HEX } from "../../../lib/constants/theme.ts";
import { themeOptions } from "./options.ts";
import {
  appearanceAccent,
  appearanceTheme,
  setAppearanceAccent,
  setAppearanceTheme,
} from "../../../lib/stores/preferences.ts";

export default function ThemeCard() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_APPEARANCE_THEME")}</CardLabel>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_THEME")}
        description={t("SETTINGS_APPEARANCE_THEME_DESCRIPTION")}
      >
        <Segmented
          label={t("SETTINGS_APPEARANCE_THEME")}
          value={appearanceTheme()}
          options={themeOptions()}
          onChange={setAppearanceTheme}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_ACCENT")}
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
