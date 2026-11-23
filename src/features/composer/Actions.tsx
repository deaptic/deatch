import { Clapperboard, Plus, X } from "lucide-solid";
import { For, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { t } from "../../shared/i18n/index.ts";
import { streamForUserId } from "../channels/index.ts";
import { clips } from "../chat/index.ts";
import { CLIP_LENGTHS } from "../../lib/constants/twitch.ts";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import * as chatModes from "../chat-modes/index.ts";
import { showsControls } from "../permissions/index.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../../lib/stores/ui.ts";
import { POPOVER_TOGGLE } from "../../shared/solid/dismissOnOutside.ts";
import Badge from "../../kit/Badge.tsx";
import ComposerPanel from "../../kit/ComposerPanel.tsx";
import IconButton from "../../kit/IconButton.tsx";
import { MenuClose } from "../../kit/Menu.tsx";
import MenuHost from "../../kit/MenuHost.tsx";
import SubMenu from "../../kit/SubMenu.tsx";
import { ChatModesList } from "../chat-modes/index.ts";
import { ChannelToolItems } from "../channel-tools/index.ts";
import { activeModes, type ChatMode } from "../chat-modes/index.ts";

type Props = {
  broadcasterId: string;
  anchorEl: () => HTMLElement | undefined;
};

export default function Actions(props: Props) {
  const settings = () => chatModes.forChannel(props.broadcasterId);
  const active = () => activeModes(settings());
  const isMod = () => showsControls(props.broadcasterId, "moderate");
  const open = () => isOverlayOpen("composerActions");
  const live = () => streamForUserId(props.broadcasterId) !== undefined;

  return (
    <>
      <span class="relative flex">
        <IconButton
          label={t("COMPOSER_ACTIONS_LABEL")}
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
          label={t("COMPOSER_ACTIONS_LABEL")}
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
                <MenuDivider />
                <SubMenu
                  label={t("COMPOSER_ACTIONS_CLIP_LABEL")}
                  icon={<Clapperboard />}
                  disabled={!live()}
                >
                  <For each={CLIP_LENGTHS}>
                    {(duration) => (
                      <MenuItem
                        label={t("COMPOSER_SECONDS_VALUE", { count: duration })}
                        onClick={() =>
                          void clips.create(props.broadcasterId, { duration })
                        }
                      />
                    )}
                  </For>
                </SubMenu>
                <Show when={isMod()}>
                  <ChannelToolItems broadcasterId={props.broadcasterId} />
                </Show>
              </MenuHost>
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
}) {
  return (
    <>
      <Show
        when={props.active.length > 0}
        fallback={
          <p class="px-2.5 py-2 text-small text-ink-soft">
            {t("COMPOSER_ACTIONS_NO_MODES_EMPTY")}
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
        <SubMenu label={t("COMPOSER_ACTIONS_CHANGE_MODES_LABEL")}>
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
  const settings = () => chatModes.forChannel(props.broadcasterId);
  const Icon = props.mode.icon;
  const turnOff = () =>
    t("COMPOSER_MODE_OFF_LABEL", { mode: t(props.mode.label) });
  return (
    <Show when={settings()}>
      {(s) => (
        <button
          type="button"
          disabled={!props.canTurnOff}
          aria-label={props.canTurnOff ? turnOff() : undefined}
          onClick={() => chatModes.update(props.broadcasterId, props.mode.off)}
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
