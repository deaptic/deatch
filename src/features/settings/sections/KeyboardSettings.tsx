import { t } from "../../../shared/i18n/index.ts";
import { For, Show, useContext } from "solid-js";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import { FilterQuery } from "../../../kit/filterQuery.ts";
import { matchesQuery } from "../../../shared/textQuery.ts";
import { SHORTCUT_GROUPS, shortcutRows } from "../keyboard.ts";
import ShortcutRow from "../ShortcutRow.tsx";

export default function KeyboardSettings() {
  const query = useContext(FilterQuery);

  return (
    <Page title={t("SETTINGS_KEYBOARD_TITLE")}>
      <For each={Object.values(SHORTCUT_GROUPS)}>
        {(g) => (
          <Card>
            <CardLabel>{t(g.title)}</CardLabel>
            <For each={shortcutRows(g)}>
              {(row) => (
                <Show when={matchesQuery(query(), row.label, row.combo)}>
                  <ShortcutRow row={row} />
                </Show>
              )}
            </For>
          </Card>
        )}
      </For>
    </Page>
  );
}
