import { For, onCleanup, onMount, Show } from "solid-js";
import { sample, watch } from "./store.ts";
import { formatBytes } from "../../shared/format/size.ts";
import { formatPercent } from "../../shared/format/units.ts";
import Loading from "../../kit/Loading.tsx";
import Popover from "../../kit/Popover.tsx";
import ConnectionSlot from "./ui/ConnectionSlot.tsx";
import Section from "./ui/Section.tsx";
import MetricRow from "./ui/MetricRow.tsx";
import { t } from "../../shared/i18n/index.ts";
import PanelHeader from "../../kit/PanelHeader.tsx";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

export default function Diagnostics(props: Props) {
  onMount(() => onCleanup(watch()));

  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-96 max-w-full max-h-160 flex flex-col">
        <PanelHeader inset title={t("DIAGNOSTICS_TITLE")} />
        <Show when={sample()} fallback={<Loading block />}>
          {(s) => (
            <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              <Section title={t("DIAGNOSTICS_APP_TITLE")}>
                <MetricRow
                  label={t("DIAGNOSTICS_MEMORY_LABEL")}
                  value={formatBytes(s().app.app.privateBytes)}
                />
                <Show when={s().jsHeapBytes}>
                  {(bytes) => (
                    <MetricRow
                      label={t("DIAGNOSTICS_JS_HEAP_LABEL")}
                      value={formatBytes(bytes())}
                    />
                  )}
                </Show>
                <MetricRow
                  label={t("DIAGNOSTICS_CPU_LABEL")}
                  value={formatPercent(s().app.app.cpuPercent ?? 0)}
                />
                <MetricRow
                  label={t("DIAGNOSTICS_WEBVIEW_MEMORY_LABEL")}
                  detail={t("DIAGNOSTICS_WEBVIEW_PROCESSES_VALUE", {
                    count: s().app.webview.processes,
                  })}
                  value={formatBytes(s().app.webview.privateBytes)}
                />
                <MetricRow
                  label={t("DIAGNOSTICS_WEBVIEW_CPU_LABEL")}
                  value={formatPercent(s().app.webview.cpuPercent ?? 0)}
                />
              </Section>

              <Section title={t("DIAGNOSTICS_EVENTSUB_TITLE")}>
                <For
                  each={Array.from(
                    { length: s().app.eventsub.maxConnections },
                    (_, i) => i,
                  )}
                >
                  {(i) => (
                    <ConnectionSlot
                      number={i + 1}
                      connection={s().app.eventsub.connections[i]}
                      capacity={s().app.eventsub.perConnection}
                    />
                  )}
                </For>
                <Show when={s().app.eventsub.waiting > 0}>
                  <MetricRow
                    label={t("DIAGNOSTICS_WAITING_STATUS")}
                    value={`${s().app.eventsub.waiting}`}
                  />
                </Show>
                <Show when={s().app.eventsub.retrying > 0}>
                  <MetricRow
                    label={t("DIAGNOSTICS_RETRYING_STATUS")}
                    value={`${s().app.eventsub.retrying}`}
                    tone="caution"
                  />
                </Show>
                <Show when={s().app.eventsub.capped > 0}>
                  <MetricRow
                    label={t("DIAGNOSTICS_OVER_LIMIT_STATUS")}
                    value={`${s().app.eventsub.capped}`}
                    tone="negative"
                  />
                </Show>
                <Show when={s().app.eventsub.rejected > 0}>
                  <MetricRow
                    label={t("DIAGNOSTICS_REJECTED_STATUS")}
                    value={`${s().app.eventsub.rejected}`}
                    tone="negative"
                  />
                </Show>
              </Section>

              <Section title={t("DIAGNOSTICS_CACHE_TITLE")}>
                <MetricRow
                  label={t("DIAGNOSTICS_USERS_LABEL")}
                  value={`${s().cache.users}`}
                />
                <MetricRow
                  label={t("DIAGNOSTICS_CHANNELS_LABEL")}
                  value={`${s().cache.channels}`}
                />
                <MetricRow
                  label={t("DIAGNOSTICS_MESSAGES_LABEL")}
                  value={`${s().cache.messages}`}
                />
              </Section>
            </div>
          )}
        </Show>
      </div>
    </Popover>
  );
}
