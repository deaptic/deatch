import { t } from "../../../shared/i18n/index.ts";
import { createSignal } from "solid-js";
import Card from "../../../kit/Card.tsx";
import CardLabel from "../../../kit/CardLabel.tsx";
import SettingsRow from "../../../kit/SettingsRow.tsx";
import Toggle from "../../../kit/Toggle.tsx";
import Dialog from "../../../kit/Dialog.tsx";
import Button from "../../../kit/Button.tsx";
import * as graphics from "../graphics.ts";
import { history } from "../../feed/index.ts";
import { systemHardwareAcceleration } from "../../preferences/index.ts";
import Transition from "../../../kit/Transition.tsx";

export default function AdvancedCard() {
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
        successMessage: t("SETTINGS_ADVANCED_CLEAR_HISTORY_TOAST"),
        failureMessage: t("SETTINGS_ADVANCED_CLEAR_HISTORY_ERROR"),
      })
      .catch(() => {});
    setClearing(false);
    setConfirmingClear(false);
  }

  async function restart(enabled: boolean) {
    setRestarting(true);
    const options = { failureMessage: t("SETTINGS_ADVANCED_RESTART_ERROR") };
    try {
      await graphics.setHardwareAcceleration(enabled, options);
    } catch {
    } finally {
      setRestarting(false);
      setPendingRestart(null);
    }
  }

  return (
    <>
      <Transition when={pendingRestart()}>
        {(pending) => (
          <Dialog
            title={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_CONFIRM_TITLE", {
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
                  {t("SETTINGS_ADVANCED_CANCEL_LABEL")}
                </Button>
                <Button
                  onClick={() => restart(pending().enabled)}
                  loading={restarting()}
                >
                  {t("SETTINGS_ADVANCED_RESTART_LABEL")}
                </Button>
              </>
            }
          />
        )}
      </Transition>
      <Card>
        <CardLabel>{t("SETTINGS_ADVANCED_TITLE")}</CardLabel>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_LABEL")}
          description={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_DESCRIPTION")}
        >
          <Toggle
            label={t("SETTINGS_ADVANCED_HARDWARE_ACCELERATION_LABEL")}
            checked={pendingRestart()?.enabled ?? systemHardwareAcceleration()}
            onChange={(enabled) => setPendingRestart({ enabled })}
          />
        </SettingsRow>
        <SettingsRow
          label={t("SETTINGS_ADVANCED_FEED_HISTORY_LABEL")}
          description={t("SETTINGS_ADVANCED_FEED_HISTORY_DESCRIPTION")}
        >
          <Button variant="danger" onClick={() => setConfirmingClear(true)}>
            {t("SETTINGS_ADVANCED_CLEAR_HISTORY_LABEL")}
          </Button>
        </SettingsRow>
      </Card>
      <Transition when={confirmingClear()}>
        {() => (
          <Dialog
            title={t("SETTINGS_ADVANCED_CLEAR_HISTORY_CONFIRM_TITLE")}
            description={t(
              "SETTINGS_ADVANCED_CLEAR_HISTORY_CONFIRM_DESCRIPTION",
            )}
            onClose={() => setConfirmingClear(false)}
            actions={
              <>
                <Button
                  variant="neutral"
                  onClick={() => setConfirmingClear(false)}
                >
                  {t("SETTINGS_ADVANCED_CANCEL_LABEL")}
                </Button>
                <Button
                  variant="danger"
                  onClick={clearHistory}
                  loading={clearing()}
                >
                  {t("SETTINGS_ADVANCED_CLEAR_HISTORY_LABEL")}
                </Button>
              </>
            }
          />
        )}
      </Transition>
    </>
  );
}
