import { addToast } from "../stores/toasts.ts";
import { t } from "../i18n/index.ts";

export function copyText(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => {
      addToast(t("COMMON_COPY_FAILED"), "error");
      return false;
    },
  );
}

export function copyField(text: string) {
  copyText(text).then((ok) => {
    if (ok) addToast(t("COMMON_COPIED"), "success");
  });
}
