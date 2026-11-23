import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import * as diagnostics from "../../lib/services/diagnostics.ts";
import type { Diagnostics as Sample } from "../../lib/types/index.ts";
import { formatBytes } from "../../lib/format/size.ts";
import { formatPercent } from "../../lib/format/units.ts";
import Loading from "../../kit/Loading.tsx";
import Popover from "../../kit/Popover.tsx";
import ConnectionSlot from "./ConnectionSlot.tsx";
import DiagnosticsSection from "./DiagnosticsSection.tsx";
import MetricRow from "./MetricRow.tsx";
import { t } from "../../lib/i18n/index.ts";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

export default function Diagnostics(props: Props) {
  const [sample, setSample] = createSignal<Sample | null>(null);
  onMount(() => onCleanup(diagnostics.watch(setSample)));

  return (
    <Popover x={props.x} y={props.y} align="center" onClose={props.onClose}>
      <div class="w-96 max-w-full max-h-160 flex flex-col">
        <header class="h-header shrink-0 flex items-center pl-5 pr-3">
          <h2 class="text-title text-ink flex-1">{t("DIAGNOSTICS_TITLE")}</h2>
        </header>
        <Show
          when={sample()}
          fallback={
            <div class="grid place-items-center py-10">
              <Loading />
            </div>
          }
        >
          {(s) => (
            <div class="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              <DiagnosticsSection title={t("DIAGNOSTICS_APP_TITLE")}>
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
              </DiagnosticsSection>

              <DiagnosticsSection title={t("DIAGNOSTICS_EVENTSUB_TITLE")}>
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
              </DiagnosticsSection>

              <DiagnosticsSection title={t("DIAGNOSTICS_CACHE_TITLE")}>
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
              </DiagnosticsSection>
            </div>
          )}
        </Show>
      </div>
    </Popover>
  );
}
