import { createSignal, For, onMount, Show } from "solid-js";
import { type Language, locale, t } from "../../lib/i18n/index.ts";
import {
  getChannelDetails,
  getContentLabels,
  modifyChannelInformation,
} from "../../lib/api/twitch/channels.ts";
import { searchCategories } from "../../lib/api/twitch/search.ts";
import { channelInfoFor } from "../../lib/stores/channels.ts";
import { autofocus } from "../../lib/reactive/focus.ts";
import { checkTag, type TagCheck } from "../../lib/utils/streamTags.ts";
import type { Category, ContentLabel } from "../../lib/types/index.ts";
import Artwork from "../ui/Artwork.tsx";
import Chip from "../ui/Chip.tsx";
import ChipInput from "../ui/ChipInput.tsx";
import Field from "../ui/Field.tsx";
import Toggle from "../ui/Toggle.tsx";
import FormField from "./FormField.tsx";
import SearchPicker from "../ui/SearchPicker.tsx";
import ToolForm from "./ToolForm.tsx";

const TITLE_LENGTH = 140;
const AUTOMATIC_LABEL = "MatureGame";

const TWITCH_LOCALES: Record<Language, string> = {
  "en-US": "en-US",
  "en-GB": "en-GB",
  fi: "fi-FI",
};

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function InfoForm(props: Props) {
  const info = channelInfoFor(props.broadcasterId);
  const [title, setTitle] = createSignal(info?.title ?? "");
  const [category, setCategory] = createSignal<Category | null>(null);
  const [tags, setTags] = createSignal<string[] | null>(null);
  const [tagError, setTagError] = createSignal<
    Extract<TagCheck, { ok: false }>["reason"] | null
  >(null);
  const [labels, setLabels] = createSignal<ContentLabel[]>([]);
  const [enabled, setEnabled] = createSignal<ReadonlySet<string>>(new Set());
  const [branded, setBranded] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);

  onMount(() => {
    getChannelDetails({ broadcasterId: props.broadcasterId }, { silent: true })
      .then((details) => {
        if (!details) return;
        setTags(details.tags);
        setEnabled(new Set(details.contentLabels));
        setBranded(details.brandedContent);
        setLoaded(true);
      })
      .catch(() => {});
    getContentLabels({ locale: TWITCH_LOCALES[locale()] }, { silent: true })
      .then((all) => setLabels(all.filter((l) => l.id !== AUTOMATIC_LABEL)))
      .catch(() => {});
  });

  function addTag(input: string) {
    const check = checkTag(input, tags() ?? []);
    if (!check.ok) return setTagError(check.reason);
    setTagError(null);
    setTags((list) => [...(list ?? []), check.tag]);
  }

  function toggleLabel(id: string, on: boolean) {
    setEnabled((set) => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function submit() {
    modifyChannelInformation(
      {
        broadcasterId: props.broadcasterId,
        title: title().trim(),
        gameId: category()?.id,
        ...(loaded() && {
          tags: tags() ?? [],
          contentLabels: labels().map((l) => ({
            id: l.id,
            enabled: enabled().has(l.id),
          })),
          brandedContent: branded(),
        }),
      },
      { successMessage: t("HEADER_INFO_UPDATED_TOAST") },
    )
      .then(props.onDone)
      .catch(() => {});
  }

  return (
    <ToolForm
      title={t("HEADER_EDIT_INFO_LABEL")}
      submitLabel={t("HEADER_SAVE_INFO_LABEL")}
      canSubmit={title().trim().length > 0}
      onSubmit={submit}
      onCancel={props.onDone}
    >
      <div class="max-h-130 overflow-y-auto -mx-1 px-1 flex flex-col gap-4">
        <FormField label={t("HEADER_STREAM_TITLE_LABEL")}>
          <Field
            ref={autofocus}
            aria-label={t("HEADER_STREAM_TITLE_LABEL")}
            maxLength={TITLE_LENGTH}
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
          />
        </FormField>
        <FormField label={t("HEADER_CATEGORY_LABEL")}>
          <SearchPicker
            label={t("HEADER_CATEGORY_LABEL")}
            placeholder={t("HEADER_CATEGORY_PLACEHOLDER")}
            initial={info?.game.name}
            search={(query) =>
              searchCategories({ query, first: 8 }, { silent: true })
            }
            name={(c) => c.name}
            picture={(c) => (
              <Artwork src={c.boxArtUrl} shape="boxart" fit="inline" />
            )}
            onPick={(c: Category | null) => setCategory(c)}
          />
        </FormField>
        <Show when={loaded()}>
          <FormField label={t("HEADER_TAGS_LABEL")}>
            <Show when={(tags() ?? []).length}>
              <div class="flex flex-wrap gap-1.5">
                <For each={tags() ?? []}>
                  {(tag) => (
                    <Chip
                      label={tag}
                      onRemove={() =>
                        setTags((list) => (list ?? []).filter((x) => x !== tag))
                      }
                    />
                  )}
                </For>
              </div>
            </Show>
            <ChipInput
              placeholder={t("HEADER_TAGS_PLACEHOLDER")}
              onAdd={addTag}
            />
            <span
              class={`text-small ${tagError() ? "text-negative" : "text-ink-faint"}`}
            >
              {tagError()
                ? t("HEADER_TAG_ERROR", { reason: tagError() ?? "" })
                : t("HEADER_TAGS_HINT")}
            </span>
          </FormField>
          <Show when={labels().length}>
            <FormField label={t("HEADER_CONTENT_LABELS_LABEL")}>
              <div class="flex flex-col gap-3">
                <For each={labels()}>
                  {(label) => (
                    <div class="flex items-start gap-3">
                      <div class="flex-1 min-w-0 flex flex-col">
                        <span class="text-body text-ink">{label.name}</span>
                        <span class="text-small text-ink-faint">
                          {label.description}
                        </span>
                      </div>
                      <Toggle
                        label={label.name}
                        checked={enabled().has(label.id)}
                        onChange={(on) => toggleLabel(label.id, on)}
                      />
                    </div>
                  )}
                </For>
              </div>
            </FormField>
          </Show>
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-body text-ink">
                {t("HEADER_BRANDED_CONTENT_LABEL")}
              </span>
              <span class="text-small text-ink-faint">
                {t("HEADER_BRANDED_CONTENT_DESCRIPTION")}
              </span>
            </div>
            <Toggle
              label={t("HEADER_BRANDED_CONTENT_LABEL")}
              checked={branded()}
              onChange={setBranded}
            />
          </div>
        </Show>
      </div>
    </ToolForm>
  );
}
