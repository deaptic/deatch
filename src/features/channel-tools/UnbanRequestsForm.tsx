import { createSignal, For, onMount, Show } from "solid-js";
import { t, tRich } from "../../shared/i18n/index.ts";
import { getBan } from "../../platform/twitch/moderation.ts";
import * as activity from "../activity/index.ts";
import * as clock from "../../shared/clock.ts";
import { formatElapsed } from "../../shared/format/duration.ts";
import type {
  BannedUser,
  UnbanDecision,
  UnbanRequest,
} from "../../shared/types/index.ts";
import Button from "../../kit/Button.tsx";
import { ChatterPicture } from "../message/index.ts";
import Dialog from "../../kit/Dialog.tsx";
import Field from "../../kit/Field.tsx";
import Text from "../../kit/Text.tsx";

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function UnbanRequestsForm(props: Props) {
  const requests = () => activity.forChannel(props.broadcasterId).unbanRequests;

  return (
    <Dialog
      title={t("UNBAN_REQUESTS_TITLE")}
      onClose={props.onDone}
      actions={
        <Button variant="neutral" onClick={() => props.onDone()}>
          {t("UNBAN_REQUESTS_CLOSE_LABEL")}
        </Button>
      }
    >
      <Show
        when={requests().length}
        fallback={
          <Text as="p" size="md" tone="soft">
            {t("UNBAN_REQUESTS_EMPTY")}
          </Text>
        }
      >
        <div class="flex flex-col gap-3 max-h-120 overflow-y-auto -mx-1 px-1">
          <For each={requests()}>
            {(request) => (
              <RequestCard
                broadcasterId={props.broadcasterId}
                request={request}
              />
            )}
          </For>
        </div>
      </Show>
    </Dialog>
  );
}

function RequestCard(props: { broadcasterId: string; request: UnbanRequest }) {
  const [ban, setBan] = createSignal<BannedUser | null>(null);
  const [note, setNote] = createSignal("");
  const [pending, setPending] = createSignal<UnbanDecision | null>(null);

  onMount(() =>
    getBan(
      { broadcasterId: props.broadcasterId, userId: props.request.user.id },
      { silent: true },
    )
      .then(setBan)
      .catch(() => {}),
  );

  function decide(decision: UnbanDecision) {
    setPending(decision);
    activity
      .resolveUnban(props.broadcasterId, props.request.id, decision, note())
      .catch(() => setPending(null));
  }

  return (
    <div class="flex flex-col gap-3 p-4 rounded-md bg-raised">
      <div class="flex items-center gap-3">
        <ChatterPicture
          size={36}
          userId={props.request.user.id}
          name={props.request.user.displayName}
        />
        <div class="flex-1 min-w-0 flex flex-col">
          <Text truncate size="md" bold tone="primary">
            {props.request.user.displayName}
          </Text>
          <Text size="sm" tone="faint">
            {t("UNBAN_REQUESTS_SENT_STATUS", {
              time: formatElapsed(
                Date.parse(props.request.createdAt),
                clock.now(),
              ),
            })}
          </Text>
        </div>
      </div>
      <p class="text-base text-ink whitespace-pre-wrap wrap-break-word">
        {props.request.text}
      </p>
      <Show when={ban()}>
        {(info) => (
          <Text as="p" size="sm" tone="soft">
            {tRich("BAN_ISSUED_BY_STATUS", {
              status: info().expiresAt ? "timeout" : "ban",
              moderator: info().moderator.displayName,
              name: (chunks) => (
                <Text bold tone="primary">
                  {chunks}
                </Text>
              ),
            })}
            <Show when={info().reason}>
              {(reason) => (
                <>
                  {" · "}
                  {t("BAN_REASON_STATUS", { reason: reason() })}
                </>
              )}
            </Show>
          </Text>
        )}
      </Show>
      <div class="flex items-center gap-2">
        <Field
          size="sm"
          class="flex-1 min-w-0"
          value={note()}
          onInput={(e) => setNote(e.currentTarget.value)}
          placeholder={t("UNBAN_REQUESTS_NOTE_PLACEHOLDER")}
          aria-label={t("UNBAN_REQUESTS_NOTE_PLACEHOLDER")}
          disabled={pending() !== null}
        />
        <Button
          variant="neutral"
          size="sm"
          loading={pending() === "deny"}
          disabled={pending() !== null}
          onClick={() => decide("deny")}
        >
          {t("UNBAN_REQUESTS_DENY_LABEL")}
        </Button>
        <Button
          size="sm"
          loading={pending() === "approve"}
          disabled={pending() !== null}
          onClick={() => decide("approve")}
        >
          {t("UNBAN_REQUESTS_APPROVE_LABEL")}
        </Button>
      </div>
    </div>
  );
}
