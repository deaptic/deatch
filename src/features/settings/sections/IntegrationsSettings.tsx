import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import { LinkCard } from "../../link/index.ts";
import {
  setSystemDiscordRichPresence,
  systemDiscordRichPresence,
} from "../../preferences/index.ts";

export default function IntegrationsSettings() {
  return (
    <Page title={t("SETTINGS_INTEGRATIONS_TITLE")}>
      <LinkCard />
      <Card>
        <CardLabel>{t("SETTINGS_INTEGRATIONS_DISCORD_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_INTEGRATIONS_DISCORD_PRESENCE_LABEL")}
          description={t("SETTINGS_INTEGRATIONS_DISCORD_PRESENCE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_INTEGRATIONS_DISCORD_PRESENCE_LABEL")}
            checked={systemDiscordRichPresence()}
            onChange={setSystemDiscordRichPresence}
          />
        </FormRow>
      </Card>
    </Page>
  );
}
