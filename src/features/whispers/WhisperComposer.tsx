import { Smile } from "lucide-solid";
import { createSignal, lazy, onMount, Show, Suspense } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { POPOVER_TOGGLE } from "../../shared/solid/dismissOnOutside.ts";
import { MAX_MESSAGE_LENGTH } from "../../shared/twitch.ts";
import IconButton from "../../kit/IconButton.tsx";
import ComposerSlot from "../../kit/ComposerSlot.tsx";
import * as emotes from "../emotes/index.ts";
import {
  CharCounter,
  ChatAutocomplete,
  type ChatAutocompleteHandle,
  type ComposerFieldApi,
  InputField,
} from "../composer/index.ts";
import { fieldFrom } from "../../shared/solid/createListbox.ts";
import {
  closeOverlay,
  isOverlayOpen,
  toggleOverlay,
} from "../navigation/index.ts";
const EmotePicker = lazy(emotes.loadEmotePicker);

type Props = {
  placeholder: string;
  onSend: (text: string) => Promise<boolean>;
};

export default function WhisperComposer(props: Props) {
  const [input, setInput] = createSignal("");
  const [sending, setSending] = createSignal(false);
  let field: ComposerFieldApi | undefined;
  const [autocomplete, setAutocomplete] =
    createSignal<ChatAutocompleteHandle | null>(null);
  const suggestionsField = fieldFrom(() => autocomplete()?.field);
  const cursor = () => field?.textareaEl()?.selectionStart ?? input().length;

  function type(value: string) {
    setInput(value);
    autocomplete()?.update(value, cursor());
  }

  onMount(() => void emotes.ensureUserLoaded());

  async function send() {
    const text = input()
      .replace(/\s*\n\s*/g, " ")
      .trim();
    if (!text || sending() || text.length > MAX_MESSAGE_LENGTH) return;
    setSending(true);
    if (await props.onSend(text)) setInput("");
    setSending(false);
    field?.focus();
  }

  return (
    <div class="p-2">
      <InputField
        {...suggestionsField}
        value={input()}
        onInput={type}
        onKeyDown={(e) => {
          if (autocomplete()?.handleKey(e)) return;
          if (e.key !== "Enter" || e.shiftKey) return;
          e.preventDefault();
          void send();
        }}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={props.placeholder}
        disabled={sending()}
        ref={(api) => {
          field = api;
          api.focus();
        }}
        addons={
          <ComposerSlot>
            <CharCounter value={input} max={MAX_MESSAGE_LENGTH} />
            <IconButton
              label={t("COMPOSER_EMOTE_PICKER_LABEL")}
              pressed={isOverlayOpen("emotePicker")}
              {...{ [POPOVER_TOGGLE]: "" }}
              onClick={() => toggleOverlay("emotePicker")}
            >
              <Smile class="size-5" />
            </IconButton>
          </ComposerSlot>
        }
      >
        <ChatAutocomplete
          getValue={input}
          getCursor={cursor}
          setValue={setInput}
          focus={() => field?.focus()}
          ref={setAutocomplete}
        />
        <Show when={isOverlayOpen("emotePicker")}>
          <Suspense>
            <EmotePicker
              onSelect={(value, opts) => {
                field?.insert(value);
                if (!opts?.keepOpen) closeOverlay();
              }}
              onClose={closeOverlay}
              anchorEl={field?.anchorEl()}
            />
          </Suspense>
        </Show>
      </InputField>
    </div>
  );
}
