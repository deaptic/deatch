import Card from "../../ui/Card.tsx";
import CardLabel from "../../ui/CardLabel.tsx";
import SettingsRow from "../../ui/SettingsRow.tsx";
import Toggle from "../../ui/Toggle.tsx";
import {
  feedDensity,
  feedShowAvatars,
  feedShowCopypasta,
  feedShowDeletedContent,
  feedShowTimestamp,
  setFeedShowAvatars,
  setFeedShowCopypasta,
  setFeedShowDeletedContent,
  setFeedShowTimestamp,
} from "../../../lib/stores/preferences.ts";

export default function MessagesCard() {
  return (
    <Card>
      <CardLabel>Messages</CardLabel>
      <SettingsRow
        label="Show timestamps"
        description="Show the time next to each message. The spacious layout always shows it."
      >
        <Toggle
          label="Show timestamps"
          disabled={feedDensity() === "comfortable"}
          checked={feedShowTimestamp()}
          onChange={setFeedShowTimestamp}
        />
      </SettingsRow>
      <SettingsRow
        label="Profile pictures"
        description="Show chatters' Twitch pictures in the spacious layout. Off uses a generated picture for everyone."
      >
        <Toggle
          label="Profile pictures"
          disabled={feedDensity() !== "comfortable"}
          checked={feedShowAvatars()}
          onChange={setFeedShowAvatars}
        />
      </SettingsRow>
      <SettingsRow
        label="Show deleted messages"
        description="Keep deleted messages readable, dimmed, instead of hiding what they said."
      >
        <Toggle
          label="Show deleted messages"
          checked={feedShowDeletedContent()}
          onChange={setFeedShowDeletedContent}
        />
      </SettingsRow>
      <SettingsRow
        label="Copypasta button"
        description="Add a button to each message that copies it into your message box."
      >
        <Toggle
          label="Copypasta button"
          checked={feedShowCopypasta()}
          onChange={setFeedShowCopypasta}
        />
      </SettingsRow>
    </Card>
  );
}
