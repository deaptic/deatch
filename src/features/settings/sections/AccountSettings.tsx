import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import { BlockedUsersCard } from "../../blocks/index.ts";
import { user } from "../../users/index.ts";

export default function AccountSettings() {
  return (
    <Page title={t("SETTINGS_ACCOUNT_TITLE")}>
      <Show when={user()}>
        {(u) => (
          <Card>
            <CardLabel>{t("SETTINGS_ACCOUNT_SIGNED_IN_TITLE")}</CardLabel>
            <FormRow label={u().displayName} description={u().login} />
          </Card>
        )}
      </Show>
      <BlockedUsersCard />
    </Page>
  );
}
