import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import PageBody from "../../../kit/PageBody.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import { BlockedUsersCard } from "../../blocks/index.ts";
import { user } from "../../users/index.ts";

export default function AccountSettings() {
  return (
    <PageBody title={t("SETTINGS_ACCOUNT_TITLE")}>
      <Show when={user()}>
        {(u) => (
          <Card>
            <CardLabel>{t("SETTINGS_ACCOUNT_SIGNED_IN_TITLE")}</CardLabel>
            <SettingsRow label={u().displayName} description={u().login} />
          </Card>
        )}
      </Show>
      <BlockedUsersCard />
    </PageBody>
  );
}
