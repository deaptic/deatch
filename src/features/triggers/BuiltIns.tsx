import { For } from "solid-js";
import Card from "../../kit/Card.tsx";
import CardLabel from "../../kit/CardLabel.tsx";
import FormRow from "../../kit/FormRow.tsx";
import Toggle from "../../kit/Toggle.tsx";
import { phraseOf, BUILT_INS } from "./builtIns/index.ts";
import { builtInEnabled, setBuiltInEnabled } from "./saved.ts";
import { t } from "../../shared/i18n/index.ts";

export default function BuiltIns() {
  return (
    <Card>
      <CardLabel>{t("SETTINGS_TRIGGERS_BUILT_IN_TITLE")}</CardLabel>
      <For each={BUILT_INS}>
        {(builtIn) => (
          <FormRow
            label={phraseOf(builtIn)}
            description={t(builtIn.description)}
          >
            <Toggle
              label={phraseOf(builtIn)}
              checked={builtInEnabled(builtIn.key)}
              onChange={(on) => setBuiltInEnabled(builtIn.key, on)}
            />
          </FormRow>
        )}
      </For>
    </Card>
  );
}
