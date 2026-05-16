import { addToast } from "../state/toasts";

export function copyField(text: string) {
  navigator.clipboard.writeText(text).then(
    () => addToast("Copied", "success"),
    () => addToast("Copy failed", "error"),
  );
}
