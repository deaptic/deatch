import { createSignal } from "solid-js";
import type { ColorKey } from "./constants";

export type { ColorKey as ToastType };

export type Toast = {
  id: number;
  title: string;
  description?: string;
  type: ColorKey;
  duration: number;
};

const [toasts, setToasts] = createSignal<Toast[]>([]);
let nextId = 0;

export { toasts };

const TYPE_DURATION: Record<ColorKey, number> = {
  error: 0,
  warn: 7000,
  success: 4000,
  info: 4000,
  log: 4000,
};

export function toast(title: string, type: ColorKey = "info", description?: string) {
  const id = nextId++;
  const duration = TYPE_DURATION[type];
  setToasts((prev) => [...prev, { id, title, description, type, duration }].slice(-3));
}

export function dismiss(id: number) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}
