import { t } from "../../shared/i18n/index.ts";
import { LogOut, Search, Settings as SettingsIcon, X } from "lucide-solid";
import * as session from "../login/index.ts";
import { user } from "../users/index.ts";
import { Dynamic } from "solid-js/web";
import * as shortcuts from "../../shared/keyboard/shortcuts.ts";
import {
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import NavItem from "../../kit/NavItem.tsx";
import { wrapIndex } from "../../shared/solid/createListNavigation.ts";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import { FilterQuery } from "../../kit/filterQuery.ts";
import {
  setSettingsSection,
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  type SettingsSection,
  settingsSection,
} from "../navigation/index.ts";
import LanguageSettings from "./sections/LanguageSettings.tsx";
import SystemSettings from "./sections/SystemSettings.tsx";
import AccountSettings from "./sections/AccountSettings.tsx";
import DeveloperSettings from "./sections/DeveloperSettings.tsx";
import NotificationsSettings from "./sections/NotificationsSettings.tsx";
import ModerationSettings from "./sections/ModerationSettings.tsx";
import { AppearanceSettings, MessagesSettings } from "../appearance/index.ts";
import KeyboardSettings from "./sections/KeyboardSettings.tsx";
import { TriggerSettings } from "../triggers/index.ts";
import { TimersSettings } from "../timers/index.ts";
import { WidgetsSettings } from "../widgets/index.ts";
import { LinkSettings } from "../link/index.ts";
import { EmbedsSettings } from "../previews/index.ts";
import SectionTitle from "../../kit/SectionTitle.tsx";
import SectionLabel from "../../kit/SectionLabel.tsx";
import Divider from "../../kit/Divider.tsx";
import Surface from "../../kit/Surface.tsx";
import Text from "../../kit/Text.tsx";

const BODIES: Record<SettingsSection, () => JSX.Element> = {
  language: LanguageSettings,
  system: SystemSettings,
  account: AccountSettings,
  appearance: AppearanceSettings,
  link: LinkSettings,
  keyboard: KeyboardSettings,
  messages: MessagesSettings,
  embeds: EmbedsSettings,
  notifications: NotificationsSettings,
  moderation: ModerationSettings,
  triggers: TriggerSettings,
  timers: TimersSettings,
  widgets: WidgetsSettings,
  developer: DeveloperSettings,
};

const SECTIONS = SETTINGS_SECTIONS.map((s) => ({
  ...s,
  Section: BODIES[s.key],
}));

const ORDER = SETTINGS_GROUPS.flatMap((g) =>
  SECTIONS.filter((s) => s.group === g.key).map((s) => s.key),
);

const LABELLED_NAV_PX = 220;
const ROW_SIDE_BY_SIDE_PX = 580;
const COLLAPSE_BELOW_PX = LABELLED_NAV_PX + ROW_SIDE_BY_SIDE_PX;

export default function Settings() {
  const [collapsed, setCollapsed] = createSignal(false);
  const [measured, setMeasured] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const searching = () => query().trim() !== "";
  createEffect(() => {
    if (query())
      onCleanup(
        shortcuts.registerLocal("escape", () => {
          setQuery("");
        }),
      );
  });
  const currentLabel = () =>
    SECTIONS.find((s) => s.key === settingsSection())?.label ??
    "SETTINGS_TITLE";

  function open(section: SettingsSection) {
    setQuery("");
    setSettingsSection(section);
  }
  let root: HTMLDivElement | undefined;

  const stepSection = (delta: 1 | -1) =>
    shortcuts.unlessFocusHandlesKeys(() => {
      const at = ORDER.indexOf(settingsSection());
      const next = ORDER[wrapIndex(at, delta, ORDER.length)];
      if (next) open(next);
    });

  onMount(() => {
    shortcuts.setContext("settingsOpen", true);
    const stops = [
      shortcuts.register(
        "settingsPage::sectionPrev",
        stepSection(-1),
        "settingsOpen",
      ),
      shortcuts.register(
        "settingsPage::sectionNext",
        stepSection(1),
        "settingsOpen",
      ),
    ];
    onCleanup(() => {
      for (const stop of stops) stop();
      shortcuts.setContext("settingsOpen", false);
    });
  });

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
        <Surface tone="none" edge="bottom" class="shrink-0">
          <div class="h-14 px-2 flex items-center">
            <Show
              when={!collapsed()}
              fallback={
                <span
                  aria-label={t("SETTINGS_TITLE")}
                  class="px-2.5 flex text-ink-faint"
                >
                  <SettingsIcon class="size-5" />
                </span>
              }
            >
              <div class="px-2.5 min-w-0">
                <SectionLabel truncate>{t("SETTINGS_TITLE")}</SectionLabel>
              </div>
            </Show>
          </div>
        </Surface>
        <For each={SETTINGS_GROUPS}>
          {(group, i) => (
            <div class="flex flex-col">
              <Show when={i() > 0} fallback={<div aria-hidden class="h-2" />}>
                <Divider class="mx-4 my-2" />
              </Show>
              <Show when={group.label}>
                {(label) => (
                  <div class="h-6 flex items-center">
                    <div class="px-4.5 min-w-0">
                      <SectionLabel hidden={collapsed()} truncate>
                        {t(label())}
                      </SectionLabel>
                    </div>
                  </div>
                )}
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
              <Show when={group.key === "end" && user()}>
                <NavItem
                  negative
                  label={t("SETTINGS_SIGN_OUT_LABEL")}
                  icon={<LogOut />}
                  active={false}
                  collapsed={collapsed()}
                  onClick={() => void session.logout()}
                />
              </Show>
            </div>
          )}
        </For>
      </nav>
      <div class="flex-1 min-w-0 flex flex-col min-h-0">
        <Surface as="header" tone="none" edge="bottom" class="shrink-0">
          <div class="h-14 px-5 flex">
            <div class="w-full max-w-170 mx-auto flex items-center gap-4">
              <SectionTitle class="flex-1" truncate>
                {searching()
                  ? t("SETTINGS_SEARCH_RESULTS_TITLE", {
                      query: query().trim(),
                    })
                  : t(currentLabel())}
              </SectionTitle>
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
                        tip={false}
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
          </div>
        </Surface>
        <FilterQuery.Provider value={query}>
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
                  <div class="hidden group-not-has-data-match:block">
                    <Text as="p" size="md" tone="soft">
                      {t("SETTINGS_SEARCH_EMPTY", { query: query().trim() })}
                    </Text>
                  </div>
                </div>
              </div>
            </Show>
          </Suspense>
        </FilterQuery.Provider>
      </div>
    </div>
  );
}
