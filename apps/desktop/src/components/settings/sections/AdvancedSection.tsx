import PageBody from "../../ui/PageBody.tsx";
import Card from "../../ui/Card.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  advancedAlwaysOnTop,
  advancedAutostart,
  advancedDeveloperMode,
  advancedDiscordRichPresence,
  advancedShowLogs,
  setAdvancedAlwaysOnTop,
  setAdvancedAutostart,
  setAdvancedDeveloperMode,
  setAdvancedDiscordRichPresence,
  setAdvancedShowLogs,
} from "../../../lib/stores/preferences.ts";

export default function AdvancedSection() {
  return (
    <PageBody title="Advanced" lede="Window behaviour and developer tools.">
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
