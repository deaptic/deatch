import { addToast } from "../stores/toasts.ts";

export function copyField(text: string) {
  navigator.clipboard.writeText(text).then(
    () => addToast("Copied", "success"),
    () => addToast("Copy failed", "error"),
  );
}
