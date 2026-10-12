import {
  Ban,
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
        <h1 class="text-title text-ink">Settings</h1>
      </header>
      <div class="flex-1 flex min-h-0">
        <nav
          aria-label="Settings sections"
          class={`shrink-0 flex flex-col gap-0.5 px-3 pt-3 border-r border-line-soft overflow-hidden transition-all duration-settle ease-out ${
            collapsed() ? "w-16" : "w-55"
          }`}
        >
          <For each={SECTIONS}>
            {(s) => (
              <NavItem
                label={s.label}
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
