import { For } from "solid-js";
import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
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
