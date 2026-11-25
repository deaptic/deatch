import { t } from "../shared/i18n/index.ts";

type Size = 16 | 20 | 24 | 32;

type Props = { size?: Size; block?: boolean };

const SIZES: Record<Size, string> = {
  16: "size-4",
  20: "size-5",
  24: "size-6",
  32: "size-8",
};

export default function Loading(props: Props) {
  const spinner = (
    <span
      role="status"
      aria-label={t("UI_LOADING_STATUS")}
      class={`inline-block shrink-0 rounded-full border-2 border-current/25 border-t-current animate-spin text-ink-soft ${
        SIZES[props.size ?? 20]
      }`}
    />
  );
  return props.block ? (
    <div class="grid place-items-center py-6">{spinner}</div>
  ) : (
    spinner
  );
}
