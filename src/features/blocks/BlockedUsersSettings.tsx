import { For, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import * as blocks from "./store.ts";
import { blocked } from "./store.ts";
import Button from "../../kit/Button.tsx";
import Card from "../../kit/Card.tsx";
import PageBody from "../../kit/PageBody.tsx";
import SettingsRow from "../../kit/SettingsRow.tsx";

export default function BlockedUsersSettings() {
  const sorted = () =>
    blocked().toSorted((a, b) => a.login.localeCompare(b.login));
  return (
    <PageBody title={t("SETTINGS_BLOCKED_TITLE")}>
      <Card>
        <Show
          when={sorted().length}
          fallback={
            <p class="px-5 py-4 text-body text-ink-soft">
              {t("SETTINGS_BLOCKED_EMPTY")}
            </p>
          }
        >
          <For each={sorted()}>
            {(blocked) => (
              <SettingsRow label={blocked.displayName}>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => blocks.unblock(blocked.id).catch(() => {})}
                >
                  {t("SETTINGS_BLOCKED_UNBLOCK_LABEL")}
                </Button>
              </SettingsRow>
            )}
          </For>
        </Show>
      </Card>
    </PageBody>
  );
}
