import { defaultWindowIcon } from "@tauri-apps/api/app";
import type { Image } from "@tauri-apps/api/image";
import { CheckMenuItem, Menu } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { invokeCommand, type InvokeOptions } from "./invoke.ts";

const TRAY_ID = "main";

export type TrayItem =
  | { kind: "action"; label: string; icon?: true; onSelect: () => void }
  | {
      kind: "check";
      id: string;
      label: string;
      checked: boolean;
      onSelect: () => void;
    }
  | { kind: "divider" };

export type Tray = {
  tooltip: string;
  items: TrayItem[];
  onOpen: () => void;
};

export type IconPixels = { rgba: Uint8Array; width: number; height: number };

export type TrayHandle = {
  icon: IconPixels | null;
  setChecked: (id: string, checked: boolean) => Promise<void>;
  setIcon: (png: Uint8Array | null) => Promise<void>;
  setTooltip: (text: string) => Promise<void>;
};

const removeExisting = async () => {
  if (await TrayIcon.getById(TRAY_ID)) await TrayIcon.removeById(TRAY_ID);
};

function menuItem(item: TrayItem, icon: Image | undefined) {
  switch (item.kind) {
    case "action":
      return {
        text: item.label,
        icon: item.icon ? icon : undefined,
        action: item.onSelect,
      };
    case "check":
      return {
        id: item.id,
        text: item.label,
        checked: item.checked,
        action: item.onSelect,
      };
    case "divider":
      return { item: "Separator" as const };
  }
}

const commands = {
  showTray: async (tray: Tray): Promise<TrayHandle> => {
    await removeExisting();
    const icon = (await defaultWindowIcon()) ?? undefined;
    const menu = await Menu.new({
      items: tray.items.map((item) => menuItem(item, icon)),
    });
    const trayIcon = await TrayIcon.new({
      id: TRAY_ID,
      icon,
      tooltip: tray.tooltip,
      menu,
      showMenuOnLeftClick: false,
      action: (event) => {
        if (event.type === "Click" && event.button === "Left") {
          if (event.buttonState === "Up") tray.onOpen();
        }
      },
    });
    return {
      icon: icon ? { rgba: await icon.rgba(), ...(await icon.size()) } : null,
      setIcon: (png) => trayIcon.setIcon(png ?? icon ?? null),
      setTooltip: (text) => trayIcon.setTooltip(text),
      setChecked: async (id, checked) => {
        const item = await menu.get(id);
        if (item instanceof CheckMenuItem) await item.setChecked(checked);
      },
    };
  },
  removeTray: removeExisting,
};

export function showTray(
  tray: Tray,
  options?: InvokeOptions,
): Promise<TrayHandle> {
  return invokeCommand(commands.showTray, [tray], options);
}

export function removeTray(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.removeTray, [], options);
}
