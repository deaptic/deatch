import { t } from "../../../lib/i18n/index.ts";
import { createSignal, Show } from "solid-js";
import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import Dialog from "../../ui/Dialog.tsx";
import Button from "../../ui/Button.tsx";
import * as graphics from "../../../lib/services/graphics.ts";
import * as history from "../../../lib/services/history.ts";
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
  setAdvancedShowLogs,
} from "../../../lib/stores/preferences.ts";

export default function AdvancedSection() {
  /// The hardware acceleration setting waiting on a confirmed restart.
  const [pendingRestart, setPendingRestart] = createSignal<{
    enabled: boolean;
  } | null>(null);
  const [restarting, setRestarting] = createSignal(false);
  const [confirmingClear, setConfirmingClear] = createSignal(false);
  const [clearing, setClearing] = createSignal(false);

  async function clearHistory() {
    setClearing(true);
    await history
      .clear({
        successMessage: t("SETTINGS_ADVANCED_CLEAR_HISTORY_DONE"),
        failureMessage: t("SETTINGS_ADVANCED_CLEAR_HISTORY_FAILED"),
      })
      .catch(() => {});
    setClearing(false);
    setConfirmingClear(false);
  }

  async function restart(enabled: boolean) {
    setRestarting(true);
    const options = { failureMessage: t("SETTINGS_ADVANCED_RESTART_FAILED") };
    try {
      await graphics.setHardwareAcceleration(enabled, options);
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
      <Show when={confirmingClear()}>
        <Dialog
          title={t("SETTINGS_ADVANCED_CLEAR_HISTORY_CONFIRM")}
          description={t("SETTINGS_ADVANCED_CLEAR_HISTORY_CONFIRM_DESCRIPTION")}
          onClose={() => setConfirmingClear(false)}
          actions={
            <>
              <Button
                variant="neutral"
                onClick={() => setConfirmingClear(false)}
              >
                {t("SETTINGS_ADVANCED_CANCEL")}
              </Button>
              <Button
                variant="danger"
                onClick={clearHistory}
                loading={clearing()}
              >
                {t("SETTINGS_ADVANCED_CLEAR_HISTORY")}
              </Button>
            </>
          }
        />
      </Show>
      <Card>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_FEED_HISTORY")}
          description={t("SETTINGS_ADVANCED_FEED_HISTORY_DESCRIPTION")}
        >
          <Button variant="danger" onClick={() => setConfirmingClear(true)}>
            {t("SETTINGS_ADVANCED_CLEAR_HISTORY")}
          </Button>
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
