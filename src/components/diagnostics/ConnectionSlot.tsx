import { Show } from "solid-js";
import type {
  ConnectionState,
  ConnectionStats,
} from "../../lib/types/index.ts";
import Meter from "../../kit/Meter.tsx";
import { type MessageKey, t } from "../../lib/i18n/index.ts";

type Props = {
  number: number;
  connection: ConnectionStats | undefined;
  capacity: number;
};

const STATE: Record<ConnectionState, { label: MessageKey; class: string }> = {
  up: { label: "DIAGNOSTICS_CONNECTED_STATUS", class: "text-positive" },
  connecting: { label: "DIAGNOSTICS_CONNECTING_STATUS", class: "text-caution" },
  lost: { label: "DIAGNOSTICS_DISCONNECTED_STATUS", class: "text-negative" },
};

export default function ConnectionSlot(props: Props) {
  const used = () => props.connection?.subscriptions ?? 0;

  return (
    <div
      class={`flex flex-col gap-1.5 ${props.connection ? "" : "opacity-40"}`}
    >
      <div class="flex items-baseline gap-3 text-body">
        <span class="flex-1 text-ink-soft">
          {t("DIAGNOSTICS_CONNECTION_LABEL", { number: props.number })}
        </span>
        <Show
          when={props.connection}
          fallback={
            <span class="text-ink-soft">
              {t("DIAGNOSTICS_NOT_OPEN_STATUS")}
            </span>
          }
        >
          {(connection) => (
            <>
              <span class={`text-small ${STATE[connection().state].class}`}>
                {t(STATE[connection().state].label)}
              </span>
              <span class="text-ink tabular-nums">
                {t("DIAGNOSTICS_USAGE_VALUE", {
                  used: used(),
                  capacity: props.capacity,
                })}
              </span>
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
