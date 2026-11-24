import { t } from "../../shared/i18n/index.ts";
import { Search, Settings as SettingsIcon, X } from "lucide-solid";
import { Dynamic } from "solid-js/web";
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
import {
  setSettingsSection,
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSection,
  settingsSection,
} from "../navigation/index.ts";
import GeneralSettings from "./sections/GeneralSettings.tsx";
import AccountSettings from "./sections/AccountSettings.tsx";
import NotificationsSettings from "./sections/NotificationsSettings.tsx";
import ModerationSettings from "./sections/ModerationSettings.tsx";
import { AppearanceSettings, MessagesSettings } from "../appearance/index.ts";
import KeyboardSettings from "./sections/KeyboardSettings.tsx";
import AdvancedSettings from "./sections/AdvancedSettings.tsx";
import { TriggerSettings } from "../triggers/index.ts";
import { LinkSettings } from "../link/index.ts";

const BODIES: Record<SettingsSection, () => JSX.Element> = {
  general: GeneralSettings,
  account: AccountSettings,
  appearance: AppearanceSettings,
  link: LinkSettings,
  keyboard: KeyboardSettings,
  advanced: AdvancedSettings,
  messages: MessagesSettings,
  notifications: NotificationsSettings,
  moderation: ModerationSettings,
  triggers: TriggerSettings,
};

const SECTIONS = SETTINGS_SECTIONS.map((s) => ({
  ...s,
  Section: BODIES[s.key],
}));

const LABELLED_NAV_PX = 220;
const ROW_SIDE_BY_SIDE_PX = 580;
const COLLAPSE_BELOW_PX = LABELLED_NAV_PX + ROW_SIDE_BY_SIDE_PX;

export default function Settings() {
  const [collapsed, setCollapsed] = createSignal(false);
  const [measured, setMeasured] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const searching = () => query().trim() !== "";
  const currentLabel = () =>
    SECTIONS.find((s) => s.key === settingsSection())?.label ??
    "SETTINGS_TITLE";

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
        <div class="shrink-0 h-14 px-2 flex items-center border-b border-line-soft">
          <Show
            when={!collapsed()}
            fallback={
              <span
                aria-label={t("SETTINGS_TITLE")}
                class="flex-1 flex justify-center text-ink-faint"
              >
                <SettingsIcon class="size-5" />
              </span>
            }
          >
            <p class="px-2.5 text-micro uppercase text-ink-faint truncate whitespace-nowrap">
              {t("SETTINGS_TITLE")}
            </p>
          </Show>
        </div>
        <For each={SETTINGS_GROUPS}>
          {(group) => (
            <div class="flex flex-col pt-2">
              <Show
                when={!collapsed()}
                fallback={
                  <div aria-hidden class="mx-4 my-1 h-px bg-line-soft" />
                }
              >
                <span class="px-4.5 pt-1.5 pb-1 text-micro uppercase text-ink-faint">
                  {t(group.label)}
                </span>
              </Show>
              <For each={SECTIONS.filter((s) => s.group === group.key)}>
                {(s) => (
                  <NavItem
                    label={t(s.label)}
                    icon={<Dynamic component={s.icon} />}
                    active={!searching() && settingsSection() === s.key}
                    collapsed={collapsed()}
                    onClick={() => open(s.key)}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </nav>
      <div class="flex-1 min-w-0 flex flex-col min-h-0">
        <header class="shrink-0 h-14 px-5 flex border-b border-line-soft">
          <div class="w-full max-w-170 mx-auto flex items-center gap-4">
            <h2 class="flex-1 min-w-0 truncate text-heading text-ink">
              {searching()
                ? t("SETTINGS_SEARCH_RESULTS_TITLE", { query: query().trim() })
                : t(currentLabel())}
            </h2>
            <div class="w-64 shrink-0 flex flex-col">
              <Field
                size="md"
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
            </div>
          </div>
        </header>
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
                <div class="w-full max-w-180 mx-auto px-5 pt-5 pb-12 flex flex-col gap-6">
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
    </div>
  );
}
