import { Plus, X } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { t } from "../../lib/i18n/index.ts";
import { chatSettingsFor } from "../../lib/stores/chatSettings.ts";
import * as chatSettings from "../../lib/services/chatSettings.ts";
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
import MenuHost from "../ui/MenuHost.tsx";
import SubMenu from "../ui/SubMenu.tsx";
import ChatModesList from "./ChatModesList.tsx";
import {
  ChannelToolForm,
  ChannelToolItems,
  type ToolForm,
} from "../channel-tools/ChannelToolsMenu.tsx";
import { activeModes, type ChatMode } from "./modes.ts";

type Props = {
  broadcasterId: string;
  anchorEl: () => HTMLElement | undefined;
};

export default function ComposerActions(props: Props) {
  const [form, setForm] = createSignal<ToolForm | null>(null);
  const settings = () => chatSettingsFor(props.broadcasterId);
  const active = () => activeModes(settings());
  const isMod = () => canModerate(props.broadcasterId);
  const open = () => isOverlayOpen("composerActions");

  return (
    <>
      <span class="relative flex">
        <IconButton
          label={t("CHAT_ACTIONS")}
          pressed={open()}
          {...{ [POPOVER_TOGGLE]: "" }}
          onClick={() => toggleOverlay("composerActions")}
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
              <MenuHost>
                <Overview
                  active={active()}
                  settingsReady={settings() !== undefined}
                  isMod={isMod()}
                  broadcasterId={props.broadcasterId}
                />
                <Show when={isMod()}>
                  <ChannelToolItems
                    broadcasterId={props.broadcasterId}
                    onOpen={setForm}
                  />
                </Show>
              </MenuHost>
            </div>
          </MenuClose.Provider>
        </ComposerPanel>
      </Show>
      <Show when={form()}>
        {(current) => (
          <ChannelToolForm
            form={current()}
            broadcasterId={props.broadcasterId}
            onDone={() => setForm(null)}
          />
        )}
      </Show>
    </>
  );
}

function Overview(props: {
  active: ChatMode[];
  settingsReady: boolean;
  isMod: boolean;
  broadcasterId: string;
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
            <ModeDetail
              mode={mode}
              broadcasterId={props.broadcasterId}
              canTurnOff={props.isMod}
            />
          )}
        </For>
      </Show>
      <Show when={props.isMod && props.settingsReady}>
        <SubMenu label={t("CHAT_ACTIONS_CHANGE_MODES")}>
          <ChatModesList broadcasterId={props.broadcasterId} />
        </SubMenu>
      </Show>
    </>
  );
}

function ModeDetail(props: {
  mode: ChatMode;
  broadcasterId: string;
  canTurnOff: boolean;
}) {
  const settings = () => chatSettingsFor(props.broadcasterId);
  const Icon = props.mode.icon;
  const turnOff = () =>
    t("CHAT_ACTIONS_TURN_OFF", { mode: t(props.mode.label) });
  return (
    <Show when={settings()}>
      {(s) => (
        <button
          type="button"
          disabled={!props.canTurnOff}
          aria-label={props.canTurnOff ? turnOff() : undefined}
          onClick={() =>
            chatSettings.update(props.broadcasterId, props.mode.off)
          }
          class="group w-full flex items-start gap-2.5 px-2.5 py-2 rounded-sm text-left transition-colors duration-snap enabled:cursor-pointer enabled:hover:bg-negative/10"
        >
          <Icon class="size-4 mt-0.5 shrink-0 text-accent-ink group-enabled:group-hover:hidden" />
          <X class="size-4 mt-0.5 shrink-0 text-negative hidden group-enabled:group-hover:block" />
          <span class="min-w-0 flex flex-col">
            <span class="text-body text-ink transition-colors duration-snap group-enabled:group-hover:text-negative">
              {t(props.mode.label)}
            </span>
            <span class="text-small text-ink-soft">
              {props.mode.description(s())}
            </span>
          </span>
        </button>
      )}
    </Show>
  );
}
