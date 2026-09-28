import { Check, X } from "lucide-solid";
import { createSignal, For, Show } from "solid-js";
import Field from "../ui/Field.tsx";
import IconButton from "../ui/IconButton.tsx";

type Props = {
  entries: Record<string, string>;
  onApply: (login: string, nickname: string) => Promise<boolean>;
  onRemove: (login: string) => void;
};

export default function NicknameEditor(props: Props) {
  const [login, setLogin] = createSignal("");
  const [nickname, setNickname] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const ready = () => !!login().trim() && !!nickname().trim();

  async function apply() {
    if (!ready() || busy()) return;
    setBusy(true);
    try {
      if (await props.onApply(login().trim(), nickname().trim())) {
        setLogin("");
        setNickname("");
      }
    } finally {
      setBusy(false);
    }
  }

  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") apply();
  };

  return (
    <div class="flex flex-col gap-2">
      <Show when={Object.keys(props.entries).length > 0}>
        <div class="flex flex-col gap-1">
          <For each={Object.entries(props.entries)}>
            {([key, value]) => (
              <div class="flex items-center gap-2 h-control-md bg-canvas border border-line rounded-sm pl-3 pr-1 text-body">
                <span class="text-ink-soft truncate">{key}</span>
                <span class="text-ink-faint text-small">→</span>
                <span class="text-ink flex-1 truncate">{value}</span>
                <IconButton
                  label="Remove"
                  size="sm"
                  onClick={() => props.onRemove(key)}
                >
                  <X class="size-3.5" />
                </IconButton>
              </div>
            )}
          </For>
        </div>
      </Show>
      <div class="flex gap-2 items-center">
        <Field
          class="flex-1 min-w-0"
          placeholder="Username"
          value={login()}
          onInput={(e) => setLogin(e.currentTarget.value)}
          onKeyDown={onEnter}
        />
        <Field
          class="flex-1 min-w-0"
          placeholder="Nickname"
          value={nickname()}
          onInput={(e) => setNickname(e.currentTarget.value)}
          onKeyDown={onEnter}
        />
        <IconButton
          label="Apply"
          variant="neutral"
          onClick={apply}
          loading={busy()}
          disabled={!ready()}
        >
          <Check class="size-4" />
        </IconButton>
      </div>
    </div>
  );
}
