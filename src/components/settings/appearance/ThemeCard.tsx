import { t } from "../../../lib/i18n/index.ts";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import ColorPicker from "../../ui/ColorPicker.tsx";
import Segmented from "../../ui/Segmented.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import * as appearance from "../../../lib/services/appearance.ts";
import type { Theme } from "../../../lib/constants/theme.ts";
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
          value={appearanceTheme()}
          options={
            [
              { value: "system", label: t("SETTINGS_APPEARANCE_THEME_SYSTEM") },
              { value: "dark", label: t("SETTINGS_APPEARANCE_THEME_DARK") },
              { value: "light", label: t("SETTINGS_APPEARANCE_THEME_LIGHT") },
            ] satisfies { value: Theme; label: string }[]
          }
          onChange={setAppearanceTheme}
        />
      </SettingsRow>
      <SettingsRow
        label={t("SETTINGS_APPEARANCE_ACCENT")}
        description={t("SETTINGS_APPEARANCE_ACCENT_DESCRIPTION")}
      >
        <ColorPicker
          swatchColor="var(--color-accent)"
          value={appearanceAccent() ?? appearance.defaultAccentHex}
          onInput={setAppearanceAccent}
          onReset={() => setAppearanceAccent(null)}
          resetDisabled={appearanceAccent() === null}
        />
      </SettingsRow>
    </Card>
  );
}
