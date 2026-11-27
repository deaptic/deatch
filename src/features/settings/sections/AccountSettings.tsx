import { Show } from "solid-js";
import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import { BlockedUsersCard } from "../../blocks/index.ts";
import { user } from "../../users/index.ts";
import {
  setSystemFollowedChannels,
  systemFollowedChannels,
} from "../../preferences/index.ts";

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
      <Card>
        <CardLabel>{t("SETTINGS_ACCOUNT_CHANNELS_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_ACCOUNT_FOLLOWED_CHANNELS_LABEL")}
          description={t("SETTINGS_ACCOUNT_FOLLOWED_CHANNELS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ACCOUNT_FOLLOWED_CHANNELS_LABEL")}
            checked={systemFollowedChannels()}
            onChange={setSystemFollowedChannels}
          />
        </FormRow>
      </Card>
      <BlockedUsersCard />
    </Page>
  );
}
