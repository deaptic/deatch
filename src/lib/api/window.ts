import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { ResizeDir } from "../types/index.ts";
import { invokeCommand, type InvokeOptions } from "./utils.ts";

type Unlisten = () => void;

const commands = {
  minimizeWindow: () => getCurrentWindow().minimize(),
  toggleMaximizeWindow: () => getCurrentWindow().toggleMaximize(),
  closeWindow: () => getCurrentWindow().close(),
  isWindowMaximized: () => getCurrentWindow().isMaximized(),
  focusWindow: () => getCurrentWindow().setFocus(),
  setWindowTitle: (title: string) => getCurrentWindow().setTitle(title),
  setAlwaysOnTop: (enabled: boolean) =>
    getCurrentWindow().setAlwaysOnTop(enabled),
  startResizeDragging: (dir: ResizeDir) =>
    getCurrentWindow().startResizeDragging(dir),
  setZoom: (factor: number) => getCurrentWebview().setZoom(factor),
  onWindowResized: (handler: () => void) =>
    getCurrentWindow().onResized(() => handler()),
  onWindowFocusChanged: (handler: (focused: boolean) => void) =>
    getCurrentWindow().onFocusChanged(({ payload }) => handler(payload)),
};

export function minimizeWindow(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.minimizeWindow, [], options);
}

export function toggleMaximizeWindow(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.toggleMaximizeWindow, [], options);
}

export function closeWindow(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.closeWindow, [], options);
}

export function isWindowMaximized(options?: InvokeOptions): Promise<boolean> {
  return invokeCommand(commands.isWindowMaximized, [], options);
}

export function focusWindow(options?: InvokeOptions): Promise<void> {
  return invokeCommand(commands.focusWindow, [], options);
}

export function setWindowTitle(
  title: string,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand(commands.setWindowTitle, [title], options);
}

export function setAlwaysOnTop(
  enabled: boolean,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand(commands.setAlwaysOnTop, [enabled], options);
}

export function startResizeDragging(
  dir: ResizeDir,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand(commands.startResizeDragging, [dir], options);
}

export function setZoom(
  factor: number,
  options?: InvokeOptions,
): Promise<void> {
  return invokeCommand(commands.setZoom, [factor], options);
}

export function onWindowResized(
  handler: () => void,
  options?: InvokeOptions,
): Promise<Unlisten> {
  return invokeCommand(commands.onWindowResized, [handler], options);
}

export function onWindowFocusChanged(
  handler: (focused: boolean) => void,
  options?: InvokeOptions,
): Promise<Unlisten> {
  return invokeCommand(commands.onWindowFocusChanged, [handler], options);
}
