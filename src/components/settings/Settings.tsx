import {
  Ban,
  Keyboard,
  Megaphone,
  Palette,
  Settings as SettingsIcon,
  Zap,
} from "lucide-solid";
import { createSignal, For, type JSX, Show } from "solid-js";
import NavItem from "../ui/NavItem.tsx";
import NotificationsSection from "./sections/NotificationsSection.tsx";
import ModerationSection from "./sections/ModerationSection.tsx";
import AppearanceSection from "./sections/AppearanceSection.tsx";
import KeyboardSection from "./sections/KeyboardSection.tsx";
import AdvancedSection from "./sections/AdvancedSection.tsx";
import TriggersSection from "./sections/TriggersSection.tsx";

type SectionKey =
  | "notifications"
  | "moderation"
  | "triggers"
  | "appearance"
  | "keyboard"
  | "advanced";

const SECTIONS: {
  key: SectionKey;
  label: string;
  Icon: (p: { class?: string }) => JSX.Element;
  Section: () => JSX.Element;
}[] = [
  {
    key: "notifications",
    label: "Notifications",
    Icon: Megaphone,
    Section: NotificationsSection,
  },
  {
    key: "appearance",
    label: "Appearance",
    Icon: Palette,
    Section: AppearanceSection,
  },
  {
    key: "moderation",
    label: "Moderation",
    Icon: Ban,
    Section: ModerationSection,
  },
  { key: "triggers", label: "Triggers", Icon: Zap, Section: TriggersSection },
  {
    key: "keyboard",
    label: "Keyboard",
    Icon: Keyboard,
    Section: KeyboardSection,
  },
  {
    key: "advanced",
    label: "Advanced",
    Icon: SettingsIcon,
    Section: AdvancedSection,
  },
];

export default function Settings() {
  const [section, setSection] = createSignal<SectionKey>("notifications");

  return (
    <div class="flex-1 flex min-h-0 min-w-0">
      <nav
        aria-label="Settings sections"
        class="basis-55 shrink min-w-16 flex flex-col gap-0.5 px-3 pt-8 border-r border-line-soft overflow-hidden"
      >
        <h1 class="text-heading text-ink px-3 pb-4 truncate">Settings</h1>
        <For each={SECTIONS}>
          {(s) => (
            <NavItem
              label={s.label}
              icon={<s.Icon />}
              active={section() === s.key}
              onClick={() => setSection(s.key)}
            />
          )}
        </For>
      </nav>
      <div class="flex-1 min-w-96 flex flex-col min-h-0">
        <For each={SECTIONS}>
          {(s) => (
            <Show when={section() === s.key}>
              <s.Section />
            </Show>
          )}
        </For>
      </div>
    </div>
  );
}
