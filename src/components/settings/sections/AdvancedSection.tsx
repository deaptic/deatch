import { t } from "../../../lib/i18n/index.ts";
import { createSignal, Show } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Dialog from "../../ui/Dialog.tsx";
import Button from "../../ui/Button.tsx";
import { relaunchApp } from "../../../lib/api/app.ts";
import { setHardwareAcceleration } from "../../../lib/api/graphics.ts";
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
  /// The hardware acceleration setting waiting on a confirmed restart.
  const [pendingRestart, setPendingRestart] = createSignal<{
    enabled: boolean;
  } | null>(null);
  const [restarting, setRestarting] = createSignal(false);

  async function restart(enabled: boolean) {
    setRestarting(true);
    const options = { failureMessage: t("SETTINGS_ADVANCED_RESTART_FAILED") };
    try {
      await setHardwareAcceleration({ enabled }, options);
      setAdvancedHardwareAcceleration(enabled);
      await relaunchApp(options);
    } catch {
      // invokeCommand already toasted; the dialog closes so the user can retry.
    } finally {
      setRestarting(false);
      setPendingRestart(null);
    }
  }

  return (
    <PageBody title={t("SETTINGS_ADVANCED")} lede={t("SETTINGS_ADVANCED_LEDE")}>
      <Show when={pendingRestart()}>
        {(pending) => (
          <Dialog
            title={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_CONFIRM", {
              enabled: pending().enabled,
            })}
            description={t("SETTINGS_ADVANCED_RESTART_DESCRIPTION")}
            onClose={() => setPendingRestart(null)}
            actions={
              <>
                <Button
                  variant="neutral"
                  onClick={() => setPendingRestart(null)}
                >
                  {t("SETTINGS_ADVANCED_CANCEL")}
                </Button>
                <Button
                  onClick={() => restart(pending().enabled)}
                  loading={restarting()}
                >
                  {t("SETTINGS_ADVANCED_RESTART")}
                </Button>
              </>
            }
          />
        )}
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
            checked={
              pendingRestart()?.enabled ?? advancedHardwareAcceleration()
            }
            onChange={(enabled) => setPendingRestart({ enabled })}
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
