import { createSignal } from "solid-js";

export type ToastType = "error" | "info" | "success" | "warn" | "log";

export type Toast = {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
};

const [toasts, setToasts] = createSignal<Toast[]>([]);
export { toasts };

const TYPE_DURATION: Record<ToastType, number> = {
  error: 0,
  warn: 7000,
  success: 4000,
  info: 4000,
  log: 4000,
};

let nextId = 0;

export function addToast(title: string, type: ToastType = "info", description?: string) {
  const id = nextId++;
  const duration = TYPE_DURATION[type];
  setToasts((prev) => [...prev, { id, title, description, type, duration }].slice(-3));
}

export function removeToast(id: number) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}
