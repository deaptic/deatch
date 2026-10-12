import { Show } from "solid-js";
import type {
  ConnectionState,
  ConnectionStats,
} from "../../lib/types/index.ts";
import Meter from "../ui/Meter.tsx";

type Props = {
  number: number;
  connection: ConnectionStats | undefined;
  capacity: number;
};

const STATE: Record<ConnectionState, { label: string; class: string }> = {
  up: { label: "Connected", class: "text-positive" },
  connecting: { label: "Connecting", class: "text-caution" },
  lost: { label: "Disconnected", class: "text-negative" },
};

export default function ConnectionSlot(props: Props) {
  const used = () => props.connection?.subscriptions ?? 0;

  return (
    <div
      class={`flex flex-col gap-1.5 ${props.connection ? "" : "opacity-40"}`}
    >
      <div class="flex items-baseline gap-3 text-body">
        <span class="flex-1 text-ink-soft">Connection {props.number}</span>
        <Show
          when={props.connection}
          fallback={<span class="text-ink-soft">Not open</span>}
        >
          {(connection) => (
            <>
              <span class={`text-small ${STATE[connection().state].class}`}>
                {STATE[connection().state].label}
              </span>
              <span class="text-ink tabular-nums">
                {used()} of {props.capacity}
              </span>
            </>
          )}
        </Show>
      </div>
      <Meter
        value={used()}
        max={props.capacity}
        label={`Subscriptions on connection ${props.number}`}
        tone={used() >= props.capacity ? "caution" : "neutral"}
      />
    </div>
  );
}
