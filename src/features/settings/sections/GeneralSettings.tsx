import { Languages } from "lucide-solid";
import {
  LANGUAGE_NAMES,
  LANGUAGES,
  type MessageKey,
  t,
} from "../../../shared/i18n/index.ts";
import { type Clock, CLOCKS } from "../../../shared/time.ts";
import { matchesQuery } from "../../../shared/textQuery.ts";
import Combobox from "../../../kit/Combobox.tsx";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import Segmented from "../../../kit/Segmented.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import AdvancedCard from "./AdvancedCard.tsx";
import {
  generalAlwaysOnTop,
  generalAutostart,
  generalDiscordRichPresence,
  appearanceLanguage,
  generalClock,
  setGeneralClock,
  setGeneralAlwaysOnTop,
  setGeneralAutostart,
  setGeneralDiscordRichPresence,
  setAppearanceLanguage,
} from "../../preferences/index.ts";

const CLOCK_LABELS: Record<Clock, MessageKey> = {
  auto: "SETTINGS_GENERAL_CLOCK_AUTO_LABEL",
  "12h": "SETTINGS_GENERAL_CLOCK_12H_LABEL",
  "24h": "SETTINGS_GENERAL_CLOCK_24H_LABEL",
};

export default function GeneralSettings() {
  return (
    <PageBody title={t("SETTINGS_GENERAL_TITLE")}>
      <Card>
        <SettingsRow
          label={t("SETTINGS_GENERAL_LANGUAGE_LABEL")}
          description={t("SETTINGS_GENERAL_LANGUAGE_DESCRIPTION")}
        >
          <div class="w-56 flex flex-col">
            <Combobox
              required
              size="md"
              value={appearanceLanguage()}
              options={[...LANGUAGES]}
              search={(query) =>
                LANGUAGES.filter((language) =>
                  matchesQuery(query, LANGUAGE_NAMES[language], language),
                )
              }
              label={(value) =>
                LANGUAGE_NAMES[LANGUAGES.find((l) => l === value) ?? "en-GB"]
              }
              placeholder={t("SETTINGS_GENERAL_LANGUAGE_LABEL")}
              ariaLabel={t("SETTINGS_GENERAL_LANGUAGE_LABEL")}
              icon={<Languages />}
              onChange={(value) => {
                const language = LANGUAGES.find((l) => l === value);
                if (language) setAppearanceLanguage(language);
              }}
            />
          </div>
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_GENERAL_CLOCK_LABEL")}
          description={t("SETTINGS_GENERAL_CLOCK_DESCRIPTION")}
        >
          <Segmented
            label={t("SETTINGS_GENERAL_CLOCK_LABEL")}
            value={generalClock()}
            options={CLOCKS.map((clock) => ({
              value: clock,
              label: t(CLOCK_LABELS[clock]),
            }))}
            onChange={setGeneralClock}
          />
        </SettingsRow>
      </Card>
      <Card>
        <SettingsRow
          label={t("SETTINGS_GENERAL_AUTOSTART_LABEL")}
          description={t("SETTINGS_GENERAL_AUTOSTART_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_GENERAL_AUTOSTART_LABEL")}
            checked={generalAutostart()}
            onChange={setGeneralAutostart}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_GENERAL_ALWAYS_ON_TOP_LABEL")}
          description={t("SETTINGS_GENERAL_ALWAYS_ON_TOP_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_GENERAL_ALWAYS_ON_TOP_LABEL")}
            checked={generalAlwaysOnTop()}
            onChange={setGeneralAlwaysOnTop}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_GENERAL_DISCORD_PRESENCE_LABEL")}
          description={t("SETTINGS_GENERAL_DISCORD_PRESENCE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_GENERAL_DISCORD_PRESENCE_LABEL")}
            checked={generalDiscordRichPresence()}
            onChange={setGeneralDiscordRichPresence}
          />
        </SettingsRow>
      </Card>
      <AdvancedCard />
    </PageBody>
  );
}
