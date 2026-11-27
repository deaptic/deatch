import { t } from "../../../shared/i18n/index.ts";
import Page from "../../../kit/Page.tsx";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import FormRow from "../../../kit/FormRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import AdvancedCard from "./AdvancedCard.tsx";
import AboutCard from "./AboutCard.tsx";
import {
  systemAlwaysOnTop,
  systemAutostart,
  systemCloseToTray,
  setSystemAlwaysOnTop,
  setSystemAutostart,
  setSystemCloseToTray,
} from "../../preferences/index.ts";

export default function SystemSettings() {
  return (
    <Page title={t("SETTINGS_SYSTEM_TITLE")}>
      <AboutCard />
      <Card>
        <CardLabel>{t("SETTINGS_SYSTEM_APP_TITLE")}</CardLabel>
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
          label={t("SETTINGS_SYSTEM_CLOSE_TO_TRAY_LABEL")}
          description={t("SETTINGS_SYSTEM_CLOSE_TO_TRAY_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_SYSTEM_CLOSE_TO_TRAY_LABEL")}
            checked={systemCloseToTray()}
            onChange={setSystemCloseToTray}
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
      </Card>
      <AdvancedCard />
    </Page>
  );
}
