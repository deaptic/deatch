import { ErrorBoundary, type JSX } from "solid-js";
import Button from "./Button.tsx";
import { t } from "../shared/i18n/index.ts";
import { addToast } from "./toasts.ts";

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

type Props = {
  label?: string;
  silent?: boolean;
  children: JSX.Element;
};

export default function Boundary(props: Props) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => {
        console.error("view crashed", err);
        if (props.silent) {
          addToast(t("ERROR_UNEXPECTED_TOAST"), "error", messageOf(err));
          return null;
        }
        return (
          <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <p class="text-base font-semibold text-ink">
              {props.label ?? t("UI_BOUNDARY_ERROR")}
            </p>
            <p class="text-sm text-ink-soft max-w-90 break-words">
              {messageOf(err)}
            </p>
            <Button variant="neutral" size="sm" class="mt-2" onClick={reset}>
              {t("UI_BOUNDARY_RETRY_LABEL")}
            </Button>
          </div>
        );
      }}
    >
      {props.children}
    </ErrorBoundary>
  );
}
