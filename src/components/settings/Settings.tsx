import { createSignal, For, Show, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside";
import Navigation from "../ui/Navigation";
import NavigationItem from "../ui/NavigationItem";
import NotificationsSection from "./sections/NotificationsSection";
import ModerationSection from "./sections/ModerationSection";
import FeedSection from "./sections/FeedSection";
import AppearanceSection from "./sections/AppearanceSection";
import AdvancedSection from "./sections/AdvancedSection";
import MegaphoneIcon from "../icons/MegaphoneIcon";
import LogIcon from "../icons/LogIcon";
import PaletteIcon from "../icons/PaletteIcon";
import GearIcon from "../icons/GearIcon";
import BanIcon from "../icons/BanIcon";
import { captureFocusForRestore } from "../../lib/utils/focus";

type SectionKey = "feed" | "notifications" | "moderation" | "appearance" | "advanced";

const SECTIONS: {
  key: SectionKey;
  label: string;
  Icon: (p: { class?: string }) => JSX.Element;
}[] = [
  { key: "notifications", label: "Notifications", Icon: MegaphoneIcon },
  { key: "feed", label: "Feed", Icon: LogIcon },
  { key: "moderation", label: "Moderation", Icon: BanIcon },
  { key: "appearance", label: "Appearance", Icon: PaletteIcon },
  { key: "advanced", label: "Advanced", Icon: GearIcon },
];

type Props = {
  onClose: () => void;
};

export default function Settings(props: Props) {
  captureFocusForRestore();
  const [section, setSection] = createSignal<SectionKey>("notifications");
  let panelRef: HTMLDivElement | undefined;

  dismissOnOutside({
    ref: () => panelRef,
    onDismiss: props.onClose,
    ignoreSelector: "[data-settings-toggle]",
  });

  return (
    <Portal>
      <div
        ref={panelRef}
        class="fixed top-12 right-2 z-40 w-[640px] h-[70vh] max-w-[calc(100vw-1rem)] max-h-[calc(100vh-4rem)] bg-bg-dark border border-border-muted rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        <div class="flex items-center px-4 h-11 border-b border-border-muted shrink-0">
          <span class="text-text text-sm font-semibold flex-1">Settings</span>
        </div>
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
      </div>
    </Portal>
  );
}
