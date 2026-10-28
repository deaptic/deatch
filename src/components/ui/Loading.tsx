import { t } from "../../lib/i18n/index.ts";

type Size = 16 | 20 | 24 | 32;

type Props = { size?: Size };

const SIZES: Record<Size, string> = {
  16: "size-4",
  20: "size-5",
  24: "size-6",
  32: "size-8",
};

export default function Loading(props: Props) {
  return (
    <span
      role="status"
      aria-label={t("UI_LOADING")}
      class={`inline-block shrink-0 rounded-full border-2 border-current/25 border-t-current animate-spin text-ink-soft ${
        SIZES[props.size ?? 20]
      }`}
    />
  );
}
