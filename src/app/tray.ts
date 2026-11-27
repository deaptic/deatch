import { createEffect, createRoot, on } from "solid-js";
import { removeTray, showTray, type TrayMenu } from "../platform/tray.ts";
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
      tooltip: t("WINDOW_DEFAULT_TITLE"),
      onOpen: open,
      items: [
        {
          kind: "action",
          label: t("WINDOW_DEFAULT_TITLE"),
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
          label: t("WINDOW_TRAY_QUIT_LABEL"),
          onSelect: () => exit.quit().catch(() => {}),
        },
      ],
    },
    { silent: true },
  );

export function start(): () => void {
  let menu: TrayMenu | null = null;
  let building: Promise<void> = Promise.resolve();
  const syncStreamerMode = () =>
    menu?.setChecked(STREAMER_MODE, streamerMode()).catch(() => {});
  const build = () => {
    building = building
      .then(createMenu)
      .then((created) => {
        menu = created;
        return syncStreamerMode();
      })
      .catch(() => {});
  };

  const dispose = createRoot((dispose) => {
    createEffect(on(locale, build));
    createEffect(
      on(streamerMode, () => void syncStreamerMode(), { defer: true }),
    );
    return dispose;
  });

  return () => {
    dispose();
    building = building
      .then(() => removeTray({ silent: true }))
      .catch(() => {});
  };
}
