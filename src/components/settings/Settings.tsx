import { type MessageKey, t } from "../../lib/i18n/index.ts";
import {
  Ban,
  Eye,
  Keyboard,
  Megaphone,
  Palette,
  Settings as SettingsIcon,
  Zap,
} from "lucide-solid";
import {
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import NavItem from "../ui/NavItem.tsx";
import NotificationsSection from "./sections/NotificationsSection.tsx";
import ModerationSection from "./sections/ModerationSection.tsx";
import AppearanceSection from "./sections/AppearanceSection.tsx";
import KeyboardSection from "./sections/KeyboardSection.tsx";
import AdvancedSection from "./sections/AdvancedSection.tsx";
import TriggersSection from "./sections/TriggersSection.tsx";
import LinkSection from "./sections/LinkSection.tsx";

type SectionKey =
  | "notifications"
  | "moderation"
  | "triggers"
  | "appearance"
  | "link"
  | "keyboard"
  | "advanced";

const SECTIONS: {
  key: SectionKey;
  label: MessageKey;
  Icon: (p: { class?: string }) => JSX.Element;
  Section: () => JSX.Element;
}[] = [
  {
    key: "notifications",
    label: "SETTINGS_NOTIFICATIONS",
    Icon: Megaphone,
    Section: NotificationsSection,
  },
  {
    key: "appearance",
    label: "SETTINGS_APPEARANCE",
    Icon: Palette,
    Section: AppearanceSection,
  },
  { key: "link", label: "SETTINGS_LINK", Icon: Eye, Section: LinkSection },
  {
    key: "moderation",
    label: "SETTINGS_MODERATION",
    Icon: Ban,
    Section: ModerationSection,
  },
  {
    key: "triggers",
    label: "SETTINGS_TRIGGERS",
    Icon: Zap,
    Section: TriggersSection,
  },
  {
    key: "keyboard",
    label: "SETTINGS_KEYBOARD",
    Icon: Keyboard,
    Section: KeyboardSection,
  },
  {
    key: "advanced",
    label: "SETTINGS_ADVANCED",
    Icon: SettingsIcon,
    Section: AdvancedSection,
  },
];

// Below this the labelled nav would squeeze the content column under its
// minimum, so the nav drops to icons.
const COLLAPSE_BELOW_PX = 640;

export default function Settings() {
  const [section, setSection] = createSignal<SectionKey>("notifications");
  const [collapsed, setCollapsed] = createSignal(false);
  let root: HTMLDivElement | undefined;

  onMount(() => {
    if (!root) return;
    const observer = new ResizeObserver(([entry]) =>
      setCollapsed(entry.contentRect.width < COLLAPSE_BELOW_PX)
    );
    observer.observe(root);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div ref={root} class="flex-1 flex flex-col min-h-0 min-w-0">
      <header class="h-header shrink-0 flex items-center px-5 border-b border-line-soft">
        <h1 class="text-title text-ink">{t("SETTINGS_TITLE")}</h1>
      </header>
      <div class="flex-1 flex min-h-0">
        <nav
          aria-label={t("SETTINGS_NAV_LABEL")}
          class={`shrink-0 flex flex-col gap-0.5 px-3 pt-3 border-r border-line-soft overflow-hidden transition-all duration-settle ease-out ${
            collapsed() ? "w-16" : "w-55"
          }`}
        >
          <For each={SECTIONS}>
            {(s) => (
              <NavItem
                label={t(s.label)}
                icon={<s.Icon />}
                active={section() === s.key}
                collapsed={collapsed()}
                onClick={() => setSection(s.key)}
              />
            )}
          </For>
        </nav>
        <div class="flex-1 min-w-0 flex flex-col min-h-0">
          <For each={SECTIONS}>
            {(s) => (
              <Show when={section() === s.key}>
                <s.Section />
              </Show>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
