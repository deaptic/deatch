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
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import Segmented from "../../../kit/Segmented.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import {
  appLanguage,
  timeFormat,
  setAppLanguage,
  setTimeFormat,
} from "../../preferences/index.ts";

const CLOCK_LABELS: Record<Clock, MessageKey> = {
  auto: "SETTINGS_LANGUAGE_CLOCK_AUTO_LABEL",
  "12h": "SETTINGS_LANGUAGE_CLOCK_12H_LABEL",
  "24h": "SETTINGS_LANGUAGE_CLOCK_24H_LABEL",
};

export default function LanguageSettings() {
  return (
    <Page title={t("SETTINGS_LANGUAGE_TITLE")}>
      <Card>
        <FormRow
          label={t("SETTINGS_LANGUAGE_LANGUAGE_LABEL")}
          description={t("SETTINGS_LANGUAGE_LANGUAGE_DESCRIPTION")}
        >
          <div class="w-56 flex flex-col">
            <Combobox
              required
              size="md"
              value={appLanguage()}
              options={[...LANGUAGES]}
              search={(query) =>
                LANGUAGES.filter((language) =>
                  matchesQuery(query, LANGUAGE_NAMES[language], language),
                )
              }
              label={(value) =>
                LANGUAGE_NAMES[LANGUAGES.find((l) => l === value) ?? "en-GB"]
              }
              placeholder={t("SETTINGS_LANGUAGE_LANGUAGE_LABEL")}
              ariaLabel={t("SETTINGS_LANGUAGE_LANGUAGE_LABEL")}
              icon={<Languages />}
              onChange={(value) => {
                const language = LANGUAGES.find((l) => l === value);
                if (language) setAppLanguage(language);
              }}
            />
          </div>
        </FormRow>
        <FormRow
          label={t("SETTINGS_LANGUAGE_CLOCK_LABEL")}
          description={t("SETTINGS_LANGUAGE_CLOCK_DESCRIPTION")}
        >
          <Segmented
            label={t("SETTINGS_LANGUAGE_CLOCK_LABEL")}
            value={timeFormat()}
            options={CLOCKS.map((clock) => ({
              value: clock,
              label: t(CLOCK_LABELS[clock]),
            }))}
            onChange={setTimeFormat}
          />
        </FormRow>
      </Card>
    </Page>
  );
}
