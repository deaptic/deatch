import { addToast } from "../stores/toasts.ts";
import { t } from "../i18n/index.ts";

export function write(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    (e: unknown) => {
      console.warn("clipboard write failed", e);
      addToast(t("CLIPBOARD_COPY_FAILED"), "error");
      return false;
    },
  );
}

export function copy(text: string) {
  void write(text).then((ok) => {
    if (ok) addToast(t("CLIPBOARD_COPIED"), "success");
  });
}
