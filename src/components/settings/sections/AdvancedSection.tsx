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
      addToast("Restart failed", "error", errorMessage(e));
    } finally {
      setRestarting(false);
      setRestartFor(null);
    }
  }

  return (
    <PageBody title="Advanced" lede="Window behaviour and developer tools.">
      <Show when={restartFor() !== null}>
        <Dialog
          title={`Turn ${restartFor() ? "on" : "off"} hardware acceleration?`}
          description="Deatch will quit and relaunch to apply the change."
          onClose={() =>
            setRestartFor(null)}
          actions={
            <>
              <Button
                variant="neutral"
                onClick={() => setRestartFor(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  restart(restartFor()!)}
                loading={restarting()}
              >
                Restart
              </Button>
            </>
          }
        />
      </Show>
      <Card>
        <SettingsRow
          label="Always on top"
          description="Keep the window above other applications."
        >
          <Toggle
            label="Always on top"
            checked={advancedAlwaysOnTop()}
            onChange={setAdvancedAlwaysOnTop}
          />
        </SettingsRow>
        <SettingsRow
          label="Launch at startup"
          description="Open Deatch when you sign in to Windows."
        >
          <Toggle
            label="Launch at startup"
            checked={advancedAutostart()}
            onChange={setAdvancedAutostart}
          />
        </SettingsRow>
        <SettingsRow
          label="Hardware acceleration"
          description="Render with the GPU. Turn off if the window flickers or shows artifacts. Changing this restarts Deatch."
        >
          <Toggle
            label="Hardware acceleration"
            checked={restartFor() ?? advancedHardwareAcceleration()}
            onChange={setRestartFor}
          />
        </SettingsRow>
        <SettingsRow
          label="Discord presence"
          description="Show the channel you're watching on Discord. Needs Discord running."
        >
          <Toggle
            label="Discord presence"
            checked={advancedDiscordRichPresence()}
            onChange={setAdvancedDiscordRichPresence}
          />
        </SettingsRow>
      </Card>
      <Card>
        <SettingsRow
          label="Developer mode"
          description="Extra technical details and copy options in menus."
        >
          <Toggle
            label="Developer mode"
            checked={advancedDeveloperMode()}
            onChange={setAdvancedDeveloperMode}
          />
        </SettingsRow>
        <SettingsRow
          label="Show logs"
          description="Show technical log messages as pop-ups."
        >
          <Toggle
            label="Show logs"
            checked={advancedShowLogs()}
            onChange={setAdvancedShowLogs}
          />
        </SettingsRow>
      </Card>
    </PageBody>
  );
}
