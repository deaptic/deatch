import {
  ChevronRight,
  Copy,
  CopyPlus,
  Ellipsis,
  ExternalLink,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-solid";
import { createResource, createSignal, For, Show } from "solid-js";
import { locale, t } from "../../shared/i18n/index.ts";
import { autofocus } from "../../shared/solid/focus.ts";
import { widgetsAddress } from "../../platform/widgets.ts";
import * as browser from "../../platform/browser.ts";
import * as clipboard from "../../kit/clipboard.ts";
import Page from "../../kit/Page.tsx";
import Card from "../../kit/Card.tsx";
import Button from "../../kit/Button.tsx";
import Callout from "../../kit/Callout.tsx";
import EmptyState from "../../kit/EmptyState.tsx";
import Field from "../../kit/Field.tsx";
import IconButton from "../../kit/IconButton.tsx";
import IconMenuButton from "../../kit/IconMenuButton.tsx";
import IconTile from "../../kit/IconTile.tsx";
import MenuDivider from "../../kit/MenuDivider.tsx";
import MenuItem from "../../kit/MenuItem.tsx";
import Segmented from "../../kit/Segmented.tsx";
import Text from "../../kit/Text.tsx";
import {
  addWidget,
  type ChatStyle,
  duplicateWidget,
  removeWidget,
  savedWidgets,
  updateWidgetStyle,
  type Widget,
} from "../preferences/index.ts";
import StyleForm, { type Tab, TAB_LABELS, TABS } from "./StyleForm.tsx";

function WidgetCard(props: {
  widget: Widget;
  address: string | undefined;
  isNew: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
}) {
  const widget = () => props.widget;
  const [tab, setTab] = createSignal<Tab>("content");
  const url = () => props.address && `${props.address}/w/${widget().id}`;
  const update = (change: Partial<ChatStyle>) =>
    updateWidgetStyle(widget().id, change);

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
          <IconTile size="md" active="accent">
            <MessageSquare />
          </IconTile>
        </button>
        <Field
          variant="inline"
          size="sm"
          class="flex-1 min-w-0"
          ref={props.isNew ? autofocus : undefined}
          aria-label={t("SETTINGS_WIDGETS_NAME_LABEL")}
          placeholder={t("SETTINGS_WIDGETS_NAME_PLACEHOLDER")}
          value={widget().style.name}
          onInput={(e) => update({ name: e.currentTarget.value })}
        />
        <Show when={url()}>
          {(link) => (
            <Button
              variant="neutral"
              size="sm"
              icon={<Copy class="size-4" />}
              onClick={() => clipboard.copy(link())}
            >
              {t("SETTINGS_WIDGETS_COPY_LINK_LABEL")}
            </Button>
          )}
        </Show>
        <IconMenuButton
          label={t("SETTINGS_WIDGETS_MORE_LABEL")}
          icon={<Ellipsis class="size-4" />}
        >
          <Show when={url()}>
            {(link) => (
              <MenuItem
                label={t("SETTINGS_WIDGETS_OPEN_LABEL")}
                icon={<ExternalLink class="size-4" />}
                onClick={() => browser.open(link())}
              />
            )}
          </Show>
          <MenuItem
            label={t("SETTINGS_WIDGETS_DUPLICATE_LABEL")}
            icon={<CopyPlus class="size-4" />}
            onClick={props.onDuplicate}
          />
          <MenuDivider />
          <MenuItem
            label={t("SETTINGS_WIDGETS_DELETE_LABEL")}
            icon={<Trash2 class="size-4" />}
            tone="negative"
            onClick={() => removeWidget(widget().id)}
          />
        </IconMenuButton>
        <IconButton
          size="sm"
          label={
            props.expanded
              ? t("SETTINGS_WIDGETS_COLLAPSE_LABEL")
              : t("SETTINGS_WIDGETS_EXPAND_LABEL")
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
      <Show when={props.expanded}>
        <div class="flex flex-col pb-2 enter-rise">
          <Show when={url()}>
            {(link) => (
              <div class="px-4 pb-2">
                <iframe
                  title={t("SETTINGS_WIDGETS_PREVIEW_TITLE")}
                  src={`${link()}?preview&lang=${locale()}`}
                  class="block w-full h-80"
                />
              </div>
            )}
          </Show>
          <div class="px-4 pb-2">
            <Segmented
              fill
              label={t("SETTINGS_WIDGETS_SECTIONS_LABEL")}
              value={tab()}
              options={TABS.map((value) => ({
                value,
                label: t(TAB_LABELS[value]),
              }))}
              onChange={setTab}
            />
          </div>
          <StyleForm tab={tab()} chatStyle={widget().style} onChange={update} />
        </div>
      </Show>
    </Card>
  );
}

export default function WidgetsSettings() {
  const [address] = createResource(() => widgetsAddress({ silent: true }));
  const [open, setOpen] = createSignal<ReadonlySet<string>>(new Set());
  const [created, setCreated] = createSignal<string | null>(null);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const reveal = (id: string) => {
    setCreated(id);
    toggle(id);
  };
  const addButton = (
    <Button
      variant="neutral"
      icon={<Plus class="size-4" />}
      onClick={() => reveal(addWidget())}
    >
      {t("SETTINGS_WIDGETS_ADD_LABEL")}
    </Button>
  );

  return (
    <Page title={t("SETTINGS_WIDGETS_TITLE")}>
      <Show when={address.error}>
        <Callout tone="negative">
          <Text>{t("SETTINGS_WIDGETS_SERVER_ERROR")}</Text>
        </Callout>
      </Show>
      <Show
        when={savedWidgets().length > 0}
        fallback={
          <EmptyState
            icon={<MessageSquare />}
            title={t("SETTINGS_WIDGETS_EMPTY_TITLE")}
            body={t("SETTINGS_WIDGETS_EMPTY")}
            action={addButton}
          />
        }
      >
        <Text size="sm" tone="faint">
          {t("SETTINGS_WIDGETS_OBS_HINT")}
        </Text>
        <For each={savedWidgets()}>
          {(widget) => (
            <WidgetCard
              widget={widget}
              address={address.error ? undefined : address()}
              isNew={created() === widget.id}
              expanded={open().has(widget.id)}
              onToggle={() => toggle(widget.id)}
              onDuplicate={() => reveal(duplicateWidget(widget))}
            />
          )}
        </For>
        <div class="self-start">{addButton}</div>
      </Show>
    </Page>
  );
}
