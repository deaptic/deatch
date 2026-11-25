import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import AdvancedCard from "./AdvancedCard.tsx";
import {
  systemAlwaysOnTop,
  systemAutostart,
  systemDiscordRichPresence,
  setSystemAlwaysOnTop,
  setSystemAutostart,
  setSystemDiscordRichPresence,
  setSystemFollowedChannels,
  systemFollowedChannels,
} from "../../preferences/index.ts";

export default function SystemSettings() {
  return (
    <Page title={t("SETTINGS_SYSTEM_TITLE")}>
      <Card>
        <FormRow
          label={t("SETTINGS_SYSTEM_AUTOSTART_LABEL")}
          description={t("SETTINGS_SYSTEM_AUTOSTART_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_SYSTEM_AUTOSTART_LABEL")}
            checked={systemAutostart()}
            onChange={setSystemAutostart}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_SYSTEM_ALWAYS_ON_TOP_LABEL")}
          description={t("SETTINGS_SYSTEM_ALWAYS_ON_TOP_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_SYSTEM_ALWAYS_ON_TOP_LABEL")}
            checked={systemAlwaysOnTop()}
            onChange={setSystemAlwaysOnTop}
          />
        </FormRow>
        <FormRow
          label={t("SETTINGS_SYSTEM_DISCORD_PRESENCE_LABEL")}
          description={t("SETTINGS_SYSTEM_DISCORD_PRESENCE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_SYSTEM_DISCORD_PRESENCE_LABEL")}
            checked={systemDiscordRichPresence()}
            onChange={setSystemDiscordRichPresence}
          />
        </FormRow>
      </Card>
      <Card>
        <CardLabel>{t("SETTINGS_SYSTEM_CHANNELS_TITLE")}</CardLabel>
        <FormRow
          label={t("SETTINGS_SYSTEM_FOLLOWED_CHANNELS_LABEL")}
          description={t("SETTINGS_SYSTEM_FOLLOWED_CHANNELS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_SYSTEM_FOLLOWED_CHANNELS_LABEL")}
            checked={systemFollowedChannels()}
            onChange={setSystemFollowedChannels}
          />
        </FormRow>
      </Card>
      <AdvancedCard />
    </Page>
  );
}
