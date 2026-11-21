import {
  ChevronLeft,
  Italic,
  Megaphone,
  Plus,
  SquareSlash,
} from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import { canModerate } from "../../lib/stores/users.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import { POPOVER_TOGGLE } from "../../lib/reactive/dismissOnOutside.ts";
import Badge from "../ui/Badge.tsx";
import ComposerPanel from "../ui/ComposerPanel.tsx";
import IconButton from "../ui/IconButton.tsx";
import { MenuClose } from "../ui/Menu.tsx";
import MenuDivider from "../ui/MenuDivider.tsx";
import MenuItem from "../ui/MenuItem.tsx";
import ChatModesList from "./ChatModesList.tsx";
import { activeModes, type ChatMode } from "./modes.ts";

type View = "overview" | "modes";

type Props = {
  broadcasterId: string;
  anchorEl: () => HTMLElement | undefined;
  onRunCommand: () => void;
  onStartCommand: (name: string) => void;
};

export default function ComposerActions(props: Props) {
  const [view, setView] = createSignal<View>("overview");
  const settings = () => chatSettingsFor(props.broadcasterId);
  const active = () => activeModes(settings());
  const isMod = () => canModerate(props.broadcasterId);
  const open = () => isOverlayOpen("composerActions");

  function toggle() {
    setView("overview");
    toggleOverlay("composerActions");
  }

  return (
    <>
      <span class="relative flex">
        <IconButton
          label={t("CHAT_ACTIONS")}
          pressed={open()}
          {...{ [POPOVER_TOGGLE]: "" }}
          onClick={toggle}
        >
          <Dynamic
            component={active()[0]?.icon ?? Plus}
            class={`size-5 ${active().length > 0 ? "text-accent-ink" : ""}`}
          />
        </IconButton>
        <Show when={active().length > 1}>
          <span class="absolute -top-1 -right-1 pointer-events-none">
            <Badge count={active().length} tone="accent" floating />
          </span>
        </Show>
      </span>
      <Show when={open()}>
        <ComposerPanel
          side="start"
          size="menu"
          label={t("CHAT_ACTIONS")}
          anchorEl={props.anchorEl()}
          onClose={closeOverlay}
        >
          <MenuClose.Provider value={closeOverlay}>
            <div role="menu" class="flex flex-col">
              <Show
                when={view() === "modes"}
                fallback={
                  <Overview
                    active={active()}
                    settingsReady={settings() !== undefined}
                    isMod={isMod()}
                    broadcasterId={props.broadcasterId}
                    onChangeModes={() => setView("modes")}
                    onRunCommand={props.onRunCommand}
                    onStartCommand={props.onStartCommand}
                  />
                }
              >
                <MenuItem
                  label={t("CHAT_ACTIONS_CHANGE_MODES")}
                  icon={<ChevronLeft />}
                  keepOpen
                  onClick={() => setView("overview")}
                />
                <MenuDivider />
                <ChatModesList broadcasterId={props.broadcasterId} />
              </Show>
            </div>
          </MenuClose.Provider>
        </ComposerPanel>
      </Show>
    </>
  );
}

function Overview(props: {
  active: ChatMode[];
  settingsReady: boolean;
  isMod: boolean;
  broadcasterId: string;
  onChangeModes: () => void;
  onRunCommand: () => void;
  onStartCommand: (name: string) => void;
}) {
  return (
    <>
      <Show
        when={props.active.length > 0}
        fallback={
          <p class="px-2.5 py-2 text-small text-ink-soft">
            {t("CHAT_ACTIONS_NO_MODES")}
          </p>
        }
      >
        <For each={props.active}>
          {(mode) => (
            <ModeDetail mode={mode} broadcasterId={props.broadcasterId} />
          )}
        </For>
      </Show>
      <Show when={props.isMod && props.settingsReady}>
        <MenuItem
          label={t("CHAT_ACTIONS_CHANGE_MODES")}
          submenu
          onClick={props.onChangeModes}
        />
      </Show>
      <MenuDivider />
      <MenuItem
        label={t("CHAT_ACTIONS_RUN_COMMAND")}
        icon={<SquareSlash />}
        hint="/"
        onClick={props.onRunCommand}
      />
      <MenuItem
        label={t("CHAT_ACTIONS_SEND_ACTION")}
        icon={<Italic />}
        hint="/me"
        onClick={() => props.onStartCommand("me")}
      />
      <Show when={props.isMod}>
        <MenuItem
          label={t("CHAT_ACTIONS_ANNOUNCE")}
          icon={<Megaphone />}
          hint="/announce"
          onClick={() => props.onStartCommand("announce")}
        />
      </Show>
    </>
  );
}

function ModeDetail(props: { mode: ChatMode; broadcasterId: string }) {
  const settings = () => chatSettingsFor(props.broadcasterId);
  const Icon = props.mode.icon;
  return (
    <Show when={settings()}>
      {(s) => (
        <div class="flex items-start gap-2.5 px-2.5 py-2">
          <Icon class="size-4 mt-0.5 shrink-0 text-accent-ink" />
          <div class="min-w-0 flex flex-col">
            <span class="text-body text-ink">{t(props.mode.label)}</span>
            <span class="text-small text-ink-soft">
              {props.mode.description(s())}
            </span>
          </div>
        </div>
      )}
    </Show>
  );
}
