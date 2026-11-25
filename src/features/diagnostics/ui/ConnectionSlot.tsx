import { Show } from "solid-js";
import type {
  ConnectionState,
  ConnectionStats,
} from "../../../shared/types/index.ts";
import Meter from "../../../kit/Meter.tsx";
import { type MessageKey, t } from "../../../shared/i18n/index.ts";
import Text, { type TextTone } from "../../../kit/Text.tsx";

type Props = {
  number: number;
  connection: ConnectionStats | undefined;
  capacity: number;
};

const STATE: Record<ConnectionState, { label: MessageKey; tone: TextTone }> = {
  up: { label: "DIAGNOSTICS_CONNECTED_STATUS", tone: "positive" },
  connecting: { label: "DIAGNOSTICS_CONNECTING_STATUS", tone: "caution" },
  lost: { label: "DIAGNOSTICS_DISCONNECTED_STATUS", tone: "negative" },
};

export default function ConnectionSlot(props: Props) {
  const used = () => props.connection?.subscriptions ?? 0;

  return (
    <div
      class={`flex flex-col gap-1.5 ${props.connection ? "" : "opacity-40"}`}
    >
      <div class="flex items-baseline gap-3 text-base">
        <Text tone="soft" class="flex-1">
          {t("DIAGNOSTICS_CONNECTION_LABEL", { number: props.number })}
        </Text>
        <Show
          when={props.connection}
          fallback={<Text tone="soft">{t("DIAGNOSTICS_NOT_OPEN_STATUS")}</Text>}
        >
          {(connection) => (
            <>
              <Text size="sm" tone={STATE[connection().state].tone}>
                {t(STATE[connection().state].label)}
              </Text>
              <Text tone="primary" tabular>
                {t("DIAGNOSTICS_USAGE_VALUE", {
                  used: used(),
                  capacity: props.capacity,
                })}
              </Text>
            </>
          )}
        </Show>
      </div>
      <Meter
        value={used()}
        max={props.capacity}
        label={t("DIAGNOSTICS_CONNECTION_SUBSCRIPTIONS_LABEL", {
          number: props.number,
        })}
        tone={used() >= props.capacity ? "caution" : "neutral"}
      />
    </div>
  );
}
