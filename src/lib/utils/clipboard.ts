import { addToast } from "../stores/toasts.ts";

export function copyText(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => {
      addToast("Copy failed", "error");
      return false;
    },
  );
}

export function copyField(text: string) {
  copyText(text).then((ok) => {
    if (ok) addToast("Copied", "success");
  });
}
