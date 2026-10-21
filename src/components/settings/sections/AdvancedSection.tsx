import { t } from "../../../lib/i18n/index.ts";
import { createSignal, Show } from "solid-js";
import { relaunch } from "@tauri-apps/plugin-process";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Dialog from "../../ui/Dialog.tsx";
import Button from "../../ui/Button.tsx";
import { setHardwareAcceleration } from "../../../lib/api/graphics.ts";
import { addToast } from "../../../lib/stores/toasts.ts";
import { errorMessage } from "../../../lib/utils/error.ts";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDeveloperMode,
  advancedDiscordRichPresence,
  advancedHardwareAcceleration,
  advancedShowLogs,
  setAdvancedAlwaysOnTop,
  setAdvancedAutostart,
  setAdvancedDeveloperMode,
  setAdvancedDiscordRichPresence,
  setAdvancedHardwareAcceleration,
  setAdvancedShowLogs,
} from "../../../lib/stores/preferences.ts";

export default function AdvancedSection() {
  const [restartFor, setRestartFor] = createSignal<boolean | null>(null);
  const [restarting, setRestarting] = createSignal(false);

  async function restart(enabled: boolean) {
    setRestarting(true);
    try {
      await setHardwareAcceleration(enabled);
      setAdvancedHardwareAcceleration(enabled);
      await relaunch();
    } catch (e) {
      addToast(t("SETTINGS_ADVANCED_RESTART_FAILED"), "error", errorMessage(e));
    } finally {
      setRestarting(false);
      setRestartFor(null);
    }
  }

  return (
    <PageBody
      title={t("SETTINGS_ADVANCED")}
      lede={t("SETTINGS_ADVANCED_LEDE")}
    >
      <Show when={restartFor() !== null}>
        <Dialog
          title={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_CONFIRM", {
            enabled: restartFor(),
          })}
          description={t("SETTINGS_ADVANCED_RESTART_DESCRIPTION")}
          onClose={() => setRestartFor(null)}
          actions={
            <>
              <Button
                variant="neutral"
                onClick={() => setRestartFor(null)}
              >
                {t("COMMON_CANCEL")}
              </Button>
              <Button
                onClick={() => restart(restartFor()!)}
                loading={restarting()}
              >
                {t("SETTINGS_ADVANCED_RESTART")}
              </Button>
            </>
          }
        />
      </Show>
      <Card>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP")}
          description={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_ALWAYS_ON_TOP")}
            checked={advancedAlwaysOnTop()}
            onChange={setAdvancedAlwaysOnTop}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_AUTOSTART")}
          description={t("SETTINGS_ADVANCED_AUTOSTART_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_AUTOSTART")}
            checked={advancedAutostart()}
            onChange={setAdvancedAutostart}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION")}
          description={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION")}
            checked={restartFor() ?? advancedHardwareAcceleration()}
            onChange={setRestartFor}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_DISCORD_PRESENCE")}
          description={t("SETTINGS_ADVANCED_DISCORD_PRESENCE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_DISCORD_PRESENCE")}
            checked={advancedDiscordRichPresence()}
            onChange={setAdvancedDiscordRichPresence}
          />
        </SettingsRow>
      </Card>
      <Card>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_DEVELOPER_MODE")}
          description={t("SETTINGS_ADVANCED_DEVELOPER_MODE_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_DEVELOPER_MODE")}
            checked={advancedDeveloperMode()}
            onChange={setAdvancedDeveloperMode}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_SHOW_LOGS")}
          description={t("SETTINGS_ADVANCED_SHOW_LOGS_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_SHOW_LOGS")}
            checked={advancedShowLogs()}
            onChange={setAdvancedShowLogs}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
