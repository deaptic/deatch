import { For } from "solid-js";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import {
  phraseOf,
  BUILT_INS,
} from "../../../lib/services/builtInTriggers/index.ts";
import {
  builtInEnabled,
  setBuiltInEnabled,
} from "../../../lib/stores/preferences.ts";
import { t } from "../../../lib/i18n/index.ts";

export default function BuiltInTriggers() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_TRIGGERS_BUILT_IN_TITLE")}</CardLabel>
      <For each={BUILT_INS}>
        {(builtIn) => (
          <SettingsRow
            label={phraseOf(builtIn)}
            description={t(builtIn.description)}
          >
            <Toggle
              label={phraseOf(builtIn)}
              checked={builtInEnabled(builtIn.key)}
              onChange={(on) => setBuiltInEnabled(builtIn.key, on)}
            />
          </SettingsRow>
        )}
      </For>
    </Card>
  );
}
