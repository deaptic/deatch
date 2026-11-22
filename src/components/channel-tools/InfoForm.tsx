import { createSignal } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { modifyChannelInformation } from "../../lib/api/twitch/channels.ts";
import { searchCategories } from "../../lib/api/twitch/search.ts";
import { channelInfoFor } from "../../lib/stores/channels.ts";
import { autofocus } from "../../lib/reactive/focus.ts";
import type { Category } from "../../lib/types/index.ts";
import Artwork from "../ui/Artwork.tsx";
import Field from "../ui/Field.tsx";
import FormField from "./FormField.tsx";
import SearchPicker from "../ui/SearchPicker.tsx";
import ToolForm from "./ToolForm.tsx";

const TITLE_LENGTH = 140;

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function InfoForm(props: Props) {
  const info = channelInfoFor(props.broadcasterId);
  const [title, setTitle] = createSignal(info?.title ?? "");
  const [category, setCategory] = createSignal<Category | null>(null);

  function submit() {
    modifyChannelInformation(
      {
        broadcasterId: props.broadcasterId,
        title: title().trim(),
        gameId: category()?.id,
      },
      { successMessage: t("TOAST_STREAM_INFO_UPDATED") },
    )
      .then(props.onDone)
      .catch(() => {});
  }

  return (
    <ToolForm
      title={t("CHANNEL_TOOLS_EDIT_INFO")}
      submitLabel={t("CHANNEL_TOOLS_SAVE_INFO")}
      canSubmit={title().trim().length > 0}
      onSubmit={submit}
      onCancel={props.onDone}
    >
      <FormField label={t("CHANNEL_TOOLS_TITLE")}>
        <Field
          ref={autofocus}
          aria-label={t("CHANNEL_TOOLS_TITLE")}
          maxLength={TITLE_LENGTH}
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
        />
      </FormField>
      <FormField label={t("CHANNEL_TOOLS_CATEGORY")}>
        <SearchPicker
          label={t("CHANNEL_TOOLS_CATEGORY")}
          placeholder={t("CHANNEL_TOOLS_SEARCH_CATEGORIES")}
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
    </ToolForm>
  );
}
