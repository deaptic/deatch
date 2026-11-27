import { createEffect, createRoot, on } from "solid-js";
import { removeTray, showTray, type TrayHandle } from "../platform/tray.ts";
import { showWindow } from "../platform/window.ts";
import { exit } from "../features/exit/index.ts";
import { updates } from "../features/updater/index.ts";
import { openSettings, settingsSection } from "../features/navigation/index.ts";
import {
  setStreamerMode,
  streamerMode,
} from "../features/preferences/index.ts";
import { locale, t } from "../shared/i18n/index.ts";
import { addToast } from "../kit/toasts.ts";
import * as inbox from "../features/inbox/index.ts";
import { appearance } from "../features/appearance/index.ts";
import { trayIconPng } from "./trayIcon.ts";
import { about } from "../features/about/index.ts";

const STREAMER_MODE = "streamer-mode";

const open = () => showWindow().catch(() => {});

async function checkForUpdates() {
  void open();
  const { kind } = await updates.check();
  if (kind === "current") addToast(t("UPDATE_UP_TO_DATE_TOAST"), "success");
  if (kind === "unreachable") addToast(t("UPDATE_CHECK_ERROR"), "error");
}

function openSettingsWindow() {
  void open();
  openSettings(settingsSection());
}

const createMenu = () =>
  showTray(
    {
      tooltip: about.name(),
      onOpen: open,
      items: [
        {
          kind: "action",
          label: about.name(),
          icon: true,
          onSelect: open,
        },
        { kind: "divider" },
        {
          kind: "check",
          id: STREAMER_MODE,
          label: t("WINDOW_TRAY_STREAMER_MODE_LABEL"),
          checked: streamerMode(),
          onSelect: () => setStreamerMode(!streamerMode()),
        },
        {
          kind: "action",
          label: t("WINDOW_TRAY_SETTINGS_LABEL"),
          onSelect: openSettingsWindow,
        },
        { kind: "divider" },
        {
          kind: "action",
          label: t("WINDOW_TRAY_CHECK_UPDATES_LABEL"),
          onSelect: () => void checkForUpdates(),
        },
        { kind: "divider" },
        {
          kind: "action",
          label: t("WINDOW_TRAY_QUIT_LABEL", { app: about.name() }),
          onSelect: () => exit.quit().catch(() => {}),
        },
      ],
    },
    { silent: true },
  );

export function start(): () => void {
  let tray: TrayHandle | null = null;
  let building: Promise<void> = Promise.resolve();
  let shownUnread = "";
  const syncStreamerMode = () =>
    tray?.setChecked(STREAMER_MODE, streamerMode()).catch(() => {});
  const syncUnread = async () => {
    const current = tray;
    if (!current) return;
    const count = inbox.unreadCount();
    const fill = appearance.token("color-negative");
    const key = `${count}/${fill}/${locale()}`;
    shownUnread = key;
    const png =
      count > 0 && current.icon ? await trayIconPng(current.icon, fill) : null;
    if (shownUnread !== key) return;
    await current.setIcon(png);
    await current.setTooltip(
      count > 0
        ? t("WINDOW_TRAY_UNREAD_LABEL", { app: about.name(), count })
        : about.name(),
    );
  };
  const build = () => {
    building = building
      .then(createMenu)
      .then((created) => {
        tray = created;
        return Promise.all([syncStreamerMode(), syncUnread()]).then(() => {});
      })
      .catch(() => {});
  };

  const dispose = createRoot((dispose) => {
    createEffect(
      on([locale, about.name], ([, name]) => {
        if (name) build();
      }),
    );
    createEffect(
      on(streamerMode, () => void syncStreamerMode(), { defer: true }),
    );
    createEffect(() => {
      inbox.unreadCount();
      appearance.token("color-negative");
      void syncUnread().catch(() => {});
    });
    return dispose;
  });

  return () => {
    dispose();
    building = building
      .then(() => removeTray({ silent: true }))
      .catch(() => {});
  };
}
