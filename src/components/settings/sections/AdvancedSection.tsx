import SettingsContent from "../SettingsContent.tsx";
import SettingsContentSection from "../SettingsContentSection.tsx";
import SettingsContentSectionItem from "../SettingsContentSectionItem.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  advancedDeveloperMode,
  setAdvancedDeveloperMode,
  advancedShowLogs,
  setAdvancedShowLogs,
  advancedAlwaysOnTop,
  setAdvancedAlwaysOnTop,
  advancedAutostart,
  setAdvancedAutostart,
  advancedDiscordRichPresence,
  setAdvancedDiscordRichPresence,
} from "../../../lib/stores/preferences.ts";

export default function AdvancedSection() {
  return (
    <SettingsContent title="Advanced">
      <SettingsContentSection>
        <SettingsContentSectionItem
          label="Developer mode"
          description="Show extra debug info and developer tools."
        >
          <Toggle
            size="md"
            checked={advancedDeveloperMode()}
            onChange={setAdvancedDeveloperMode}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Show logs"
          description="Surface log messages as toasts."
        >
          <Toggle
            size="md"
            checked={advancedShowLogs()}
            onChange={setAdvancedShowLogs}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Always on top"
          description="Keep the window above other applications."
        >
          <Toggle
            size="md"
            checked={advancedAlwaysOnTop()}
            onChange={setAdvancedAlwaysOnTop}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Launch at startup"
          description="Start the app automatically when you sign in."
        >
          <Toggle
            size="md"
            checked={advancedAutostart()}
            onChange={setAdvancedAutostart}
          />
        </SettingsContentSectionItem>
        <SettingsContentSectionItem
          label="Discord Rich Presence"
          description="Show what you're watching on your Discord profile. Requires Discord to be running."
        >
          <Toggle
            size="md"
            checked={advancedDiscordRichPresence()}
            onChange={setAdvancedDiscordRichPresence}
          />
        </SettingsContentSectionItem>
      </SettingsContentSection>
    </SettingsContent>
  );
}
