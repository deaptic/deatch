import { type MessageKey, t } from "../../shared/i18n/index.ts";
import {
  Ban,
  Eye,
  Keyboard,
  Megaphone,
  Palette,
  Search,
  Settings as SettingsIcon,
  UserX,
  X,
  Zap,
} from "lucide-solid";
import {
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import NavItem from "../../kit/NavItem.tsx";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import { SettingsQuery } from "../../kit/settingsQuery.ts";
import InputPopover from "../../kit/InputPopover.tsx";
import { SIDE_GAP } from "../../kit/Popover.tsx";
import {
  setSettingsSection,
  type SettingsSection,
  settingsSection,
} from "../../lib/stores/view.ts";
import NotificationsSettings from "./sections/NotificationsSettings.tsx";
import ModerationSettings from "./sections/ModerationSettings.tsx";
import { AppearanceSettings } from "../appearance/index.ts";
import KeyboardSettings from "./sections/KeyboardSettings.tsx";
import AdvancedSettings from "./sections/AdvancedSettings.tsx";
import { TriggerSettings } from "../triggers/index.ts";
import { LinkSettings } from "../link/index.ts";
import BlockedUsersSettings from "./sections/BlockedUsersSettings.tsx";

const SECTIONS: {
  key: SettingsSection;
  label: MessageKey;
  Icon: (p: { class?: string }) => JSX.Element;
  Section: () => JSX.Element;
}[] = [
  {
    key: "notifications",
    label: "SETTINGS_NOTIFICATIONS_TITLE",
    Icon: Megaphone,
    Section: NotificationsSettings,
  },
  {
    key: "appearance",
    label: "SETTINGS_APPEARANCE_TITLE",
    Icon: Palette,
    Section: AppearanceSettings,
  },
  {
    key: "link",
    label: "SETTINGS_LINK_TITLE",
    Icon: Eye,
    Section: LinkSettings,
  },
  {
    key: "moderation",
    label: "SETTINGS_MODERATION_TITLE",
    Icon: Ban,
    Section: ModerationSettings,
  },
  {
    key: "blocked",
    label: "SETTINGS_BLOCKED_TITLE",
    Icon: UserX,
    Section: BlockedUsersSettings,
  },
  {
    key: "triggers",
    label: "SETTINGS_TRIGGERS_TITLE",
    Icon: Zap,
    Section: TriggerSettings,
  },
  {
    key: "keyboard",
    label: "SETTINGS_KEYBOARD_TITLE",
    Icon: Keyboard,
    Section: KeyboardSettings,
  },
  {
    key: "advanced",
    label: "SETTINGS_ADVANCED_TITLE",
    Icon: SettingsIcon,
    Section: AdvancedSettings,
  },
];

const LABELLED_NAV_PX = 220;
const ROW_SIDE_BY_SIDE_PX = 580;
const COLLAPSE_BELOW_PX = LABELLED_NAV_PX + ROW_SIDE_BY_SIDE_PX;

export default function Settings() {
  const [collapsed, setCollapsed] = createSignal(false);
  const [measured, setMeasured] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const searching = () => query().trim() !== "";

  const [searchAt, setSearchAt] = createSignal<{ x: number; y: number }>();
  let searchButton: HTMLButtonElement | undefined;

  function toggleSearchPopover() {
    if (searchAt()) return setSearchAt(undefined);
    if (!searchButton) return;
    const rect = searchButton.getBoundingClientRect();
    setSearchAt({ x: rect.right + SIDE_GAP, y: rect.top });
  }

  function open(section: SettingsSection) {
    setQuery("");
    setSettingsSection(section);
  }
  let root: HTMLDivElement | undefined;

  onMount(() => {
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setCollapsed(entry.contentRect.width < COLLAPSE_BELOW_PX);
      if (!measured()) requestAnimationFrame(() => setMeasured(true));
    });
    observer.observe(root);
    onCleanup(() => observer.disconnect());
  });

  return (
    <div ref={root} class="flex-1 flex min-h-0 min-w-0">
      <nav
        aria-label={t("SETTINGS_NAV_LABEL")}
        class={`shrink-0 flex flex-col gap-0.5 pb-2 overflow-hidden ${
          measured() ? "transition-all duration-settle ease-drawer" : ""
        } ${collapsed() ? "w-14" : "w-55"}`}
      >
        <div class="flex flex-col gap-2 px-2 pt-4 pb-2">
          <p
            aria-hidden={collapsed()}
            class={`px-2.5 text-micro uppercase text-ink-faint truncate whitespace-nowrap transition-opacity duration-settle ${
              collapsed() ? "opacity-0" : "opacity-100"
            }`}
          >
            {t("SETTINGS_TITLE")}
          </p>
          <Show
            when={!collapsed()}
            fallback={
              <IconButton
                ref={(el) => (searchButton = el)}
                class="self-center"
                label={t("SETTINGS_SEARCH_LABEL")}
                size="sm"
                pressed={searching()}
                onClick={toggleSearchPopover}
              >
                <Search class="size-4" />
              </IconButton>
            }
          >
            <Field
              size="sm"
              icon={<Search />}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              placeholder={t("SETTINGS_SEARCH_LABEL")}
              aria-label={t("SETTINGS_SEARCH_LABEL")}
              trailing={
                <Show when={query()}>
                  <IconButton
                    label={t("SETTINGS_SEARCH_CLEAR_LABEL")}
                    size="sm"
                    onClick={() => setQuery("")}
                  >
                    <X class="size-4" />
                  </IconButton>
                </Show>
              }
            />
          </Show>
        </div>
        <For each={SECTIONS}>
          {(s) => (
            <NavItem
              label={t(s.label)}
              icon={<s.Icon />}
              active={!searching() && settingsSection() === s.key}
              collapsed={collapsed()}
              onClick={() => open(s.key)}
            />
          )}
        </For>
      </nav>
      <div class="flex-1 min-w-0 flex flex-col min-h-0">
        <SettingsQuery.Provider value={query}>
          <Suspense>
            <Show
              when={searching()}
              fallback={
                <For each={SECTIONS}>
                  {(s) => (
                    <Show when={settingsSection() === s.key}>
                      <s.Section />
                    </Show>
                  )}
                </For>
              }
            >
              <div class="group flex-1 min-h-0 overflow-y-auto">
                <div class="w-full max-w-260 mx-auto px-5 pt-6 pb-12 flex flex-col gap-8">
                  <For each={SECTIONS}>{(s) => <s.Section />}</For>
                  <p class="hidden group-not-has-data-match:block text-body text-ink-soft">
                    {t("SETTINGS_SEARCH_EMPTY", { query: query().trim() })}
                  </p>
                </div>
              </div>
            </Show>
          </Suspense>
        </SettingsQuery.Provider>
      </div>
      <Show when={searchAt()}>
        {(at) => (
          <InputPopover
            x={at().x}
            y={at().y}
            value={query()}
            placeholder={t("SETTINGS_SEARCH_LABEL")}
            opener={() => searchButton}
            onInput={setQuery}
            onSubmit={() => setSearchAt(undefined)}
            onClose={() => setSearchAt(undefined)}
          />
        )}
      </Show>
    </div>
  );
}
