import { t } from "../shared/i18n/index.ts";

type Size = "xs" | "sm" | "md" | "lg";

type Props = { size?: Size; block?: boolean };

const SIZES: Record<Size, string> = {
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
};

export default function Loading(props: Props) {
  const spinner = (
    <span
      role="status"
      aria-label={t("UI_LOADING_STATUS")}
      class={`inline-block shrink-0 rounded-full border-2 border-current/25 border-t-current animate-spin text-ink-soft ${
        SIZES[props.size ?? "sm"]
      }`}
    />
  );
  return props.block ? (
    <div class="grid place-items-center py-6">{spinner}</div>
  ) : (
    spinner
  );
}
