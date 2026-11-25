import {
  ChevronRight,
  Clock,
  MessageSquare,
  Plus,
  Timer as TimerIcon,
  Trash2,
} from "lucide-solid";
import { createSignal, For, type JSX, Show } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { MAX_MESSAGE_LENGTH } from "../../shared/twitch.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import PageBody from "../../kit/PageBody.tsx";
import Card from "../../kit/Card.tsx";
import Chip from "../../kit/Chip.tsx";
import Button from "../../kit/Button.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import Segmented from "../../kit/Segmented.tsx";
import Textarea from "../../kit/Textarea.tsx";
import Toggle from "../../kit/Toggle.tsx";
import {
  addTimer,
  removeTimer,
  savedTimers,
  type Timer,
  TIMER_ACTIVITY,
  TIMER_MINUTES,
  updateTimer,
} from "../preferences/index.ts";
import SectionLabel from "../../kit/SectionLabel.tsx";
import IconTile from "../../kit/IconTile.tsx";

function Choice(props: { label: string; children: JSX.Element }) {
  return (
    <div class="flex flex-col gap-1.5 min-w-0">
      <SectionLabel>{props.label}</SectionLabel>
      {props.children}
    </div>
  );
}

function TimerCard(props: {
  timer: Timer;
  isNew: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const timer = () => props.timer;
  const update = (change: Partial<Omit<Timer, "id">>) =>
    updateTimer(timer().id, change);

  return (
    <Card>
      <div class="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={props.onToggle}
          class="group shrink-0 cursor-pointer"
        >
          <IconTile size="md" active={timer().enabled && "accent"}>
            <TimerIcon />
          </IconTile>
        </button>
        <Field
          look="inline"
          size="sm"
          class="flex-1 min-w-0"
          ref={props.isNew ? autofocus : undefined}
          aria-label={t("SETTINGS_TIMERS_NAME_LABEL")}
          placeholder={t("SETTINGS_TIMERS_NAME_PLACEHOLDER")}
          value={timer().name}
          onInput={(e) => update({ name: e.currentTarget.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !props.expanded) props.onToggle();
          }}
        />
        <Chip
          variant="label"
          icon={<Clock class="size-3" />}
          label={t("SETTINGS_TIMERS_MINUTES_VALUE", {
            count: timer().minutes,
          })}
        />
        <Chip
          variant="label"
          icon={<MessageSquare class="size-3" />}
          label={t("SETTINGS_TIMERS_ACTIVITY_VALUE", {
            count: timer().minMessages,
          })}
        />
        <Toggle
          label={t("SETTINGS_TIMERS_ENABLED_LABEL")}
          checked={timer().enabled}
          onChange={(enabled) => update({ enabled })}
        />
        <IconButton
          label={t("SETTINGS_TIMERS_DELETE_LABEL")}
          size="sm"
          onClick={() => removeTimer(timer().id)}
        >
          <Trash2 class="size-4" />
        </IconButton>
        <IconButton
          size="sm"
          label={
            props.expanded
              ? t("SETTINGS_TIMERS_COLLAPSE_LABEL")
              : t("SETTINGS_TIMERS_EXPAND_LABEL")
          }
          aria-expanded={props.expanded}
          onClick={props.onToggle}
        >
          <ChevronRight
            class={`size-4 transition-transform duration-quick ${
              props.expanded ? "rotate-90" : ""
            }`}
          />
        </IconButton>
      </div>

      <Show when={!props.expanded && timer().message.trim()}>
        <button
          type="button"
          tabIndex={-1}
          onClick={props.onToggle}
          class="w-full -mt-1 pb-3 pl-18.5 pr-4 truncate text-small text-ink-faint text-left cursor-pointer"
        >
          {timer().message}
        </button>
      </Show>

      <Show when={props.expanded}>
        <div
          class={`@container flex flex-col gap-4 px-4 pb-4 enter-rise transition-opacity duration-snap ${
            timer().enabled ? "" : "opacity-60"
          }`}
        >
          <div class="flex flex-col gap-1">
            <Textarea
              aria-label={t("SETTINGS_TIMERS_MESSAGE_LABEL")}
              placeholder={t("SETTINGS_TIMERS_MESSAGE_PLACEHOLDER")}
              maxLength={MAX_MESSAGE_LENGTH}
              value={timer().message}
              onInput={(e) => update({ message: e.currentTarget.value })}
            />
            <span class="self-end text-micro text-ink-faint tabular-nums">
              {t("SETTINGS_TIMERS_LENGTH_VALUE", {
                count: timer().message.length,
                max: MAX_MESSAGE_LENGTH,
              })}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 @max-lg:grid-cols-1">
            <Choice label={t("SETTINGS_TIMERS_EVERY_LABEL")}>
              <Segmented
                fill
                label={t("SETTINGS_TIMERS_EVERY_LABEL")}
                value={String(timer().minutes)}
                options={TIMER_MINUTES.map((minutes) => ({
                  value: String(minutes),
                  label: String(minutes),
                }))}
                onChange={(v) => update({ minutes: Number(v) })}
              />
            </Choice>
            <Choice label={t("SETTINGS_TIMERS_ACTIVITY_LABEL")}>
              <Segmented
                fill
                label={t("SETTINGS_TIMERS_ACTIVITY_LABEL")}
                value={String(timer().minMessages)}
                options={TIMER_ACTIVITY.map((count) => ({
                  value: String(count),
                  label: t("SETTINGS_TIMERS_ACTIVITY_VALUE", { count }),
                }))}
                onChange={(v) => update({ minMessages: Number(v) })}
              />
            </Choice>
          </div>
        </div>
      </Show>
    </Card>
  );
}

export default function TimersSettings() {
  const [open, setOpen] = createSignal<ReadonlySet<string>>(new Set());
  const [created, setCreated] = createSignal<string | null>(null);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const add = () => {
    const id = addTimer();
    setCreated(id);
    toggle(id);
  };
  const addButton = (
    <Button variant="neutral" icon={<Plus class="size-4" />} onClick={add}>
      {t("SETTINGS_TIMERS_ADD_LABEL")}
    </Button>
  );

  return (
    <PageBody title={t("SETTINGS_TIMERS_TITLE")}>
      <Show
        when={savedTimers().length > 0}
        fallback={
          <EmptyState
            icon={<TimerIcon />}
            title={t("SETTINGS_TIMERS_EMPTY_TITLE")}
            body={t("SETTINGS_TIMERS_EMPTY")}
            action={addButton}
          />
        }
      >
        <For each={savedTimers()}>
          {(timer) => (
            <TimerCard
              timer={timer}
              isNew={created() === timer.id}
              expanded={open().has(timer.id)}
              onToggle={() => toggle(timer.id)}
            />
          )}
        </For>
        <div class="self-start">{addButton}</div>
      </Show>
    </PageBody>
  );
}
