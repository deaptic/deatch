import { addToast } from "../stores/toasts.ts";
import { t } from "../i18n/index.ts";

export function write(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    (e: unknown) => {
      console.warn("clipboard write failed", e);
      addToast(t("UI_COPY_FAILED_ERROR"), "error");
      return false;
    },
  );
}

export function copy(text: string) {
  void write(text).then((ok) => {
    if (ok) addToast(t("UI_COPIED_TOAST"), "success");
  });
}
