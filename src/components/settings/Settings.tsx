import { Ban, Megaphone, Palette, ScrollText, Settings as SettingsIcon } from "lucide-solid";
import { createSignal, For, Show, type JSX } from "solid-js";
import Panel from "../ui/Panel.tsx";
import Navigation from "../ui/Navigation.tsx";
import NavigationItem from "../ui/NavigationItem.tsx";
import NotificationsSection from "./sections/NotificationsSection.tsx";
import ModerationSection from "./sections/ModerationSection.tsx";
import FeedSection from "./sections/FeedSection.tsx";
import AppearanceSection from "./sections/AppearanceSection.tsx";
import AdvancedSection from "./sections/AdvancedSection.tsx";

type SectionKey = "feed" | "notifications" | "moderation" | "appearance" | "advanced";

const SECTIONS: {
  key: SectionKey;
  label: string;
  Icon: (p: { class?: string }) => JSX.Element;
}[] = [
  { key: "notifications", label: "Notifications", Icon: Megaphone },
  { key: "feed", label: "Feed", Icon: ScrollText },
  { key: "moderation", label: "Moderation", Icon: Ban },
  { key: "appearance", label: "Appearance", Icon: Palette },
  { key: "advanced", label: "Advanced", Icon: SettingsIcon },
];

type Props = {
  onClose: () => void;
};

export default function Settings(props: Props) {
  const [section, setSection] = createSignal<SectionKey>("notifications");

  return (
    <Panel
      title="Settings"
      onClose={props.onClose}
      ignoreSelector="[data-settings-toggle]"
      sizeClass="w-[640px] h-[70vh] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-4rem)]"
    >
      <div class="flex-1 flex min-h-0">
          <Navigation
            orientation="vertical"
            class="w-48 shrink-0 border-r border-border-muted bg-bg-dark py-3"
          >
            <For each={SECTIONS}>
              {(s) => (
                <NavigationItem
                  label={s.label}
                  icon={<s.Icon class="w-3.5 h-3.5" />}
                  active={section() === s.key}
                  onClick={() => setSection(s.key)}
                />
              )}
            </For>
          </Navigation>
          <Show when={section() === "notifications"}>
            <NotificationsSection />
          </Show>
          <Show when={section() === "moderation"}>
            <ModerationSection />
          </Show>
          <Show when={section() === "feed"}>
            <FeedSection />
          </Show>
          <Show when={section() === "appearance"}>
            <AppearanceSection />
          </Show>
          <Show when={section() === "advanced"}>
            <AdvancedSection />
          </Show>
        </div>
    </Panel>
  );
}
