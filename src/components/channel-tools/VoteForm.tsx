import { Plus } from "lucide-solid";
import { createSignal, Index, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";
import { createPoll } from "../../lib/api/twitch/polls.ts";
import { createPrediction } from "../../lib/api/twitch/predictions.ts";
import { formatDuration } from "../../lib/format/duration.ts";
import { autofocus } from "../../lib/reactive/focus.ts";
import Button from "../ui/Button.tsx";
import Field from "../ui/Field.tsx";
import Segmented from "../ui/Segmented.tsx";
import FormField from "./FormField.tsx";
import ToolForm from "./ToolForm.tsx";
import {
  canStartVote,
  DEFAULT_DURATION,
  filledOptions,
  MIN_OPTIONS,
  OPTION_LENGTH,
  VOTE_DURATIONS,
  VOTE_LIMITS,
  type VoteKind,
} from "./vote.ts";

const COPY = {
  poll: {
    title: "HEADER_START_POLL_LABEL",
    submit: "HEADER_SUBMIT_POLL_LABEL",
    time: "HEADER_VOTING_TIME_LABEL",
  },
  prediction: {
    title: "HEADER_START_PREDICTION_LABEL",
    submit: "HEADER_SUBMIT_PREDICTION_LABEL",
    time: "HEADER_PREDICTION_WINDOW_LABEL",
  },
} as const;

type Props = {
  kind: VoteKind;
  broadcasterId: string;
  onDone: () => void;
};

export default function VoteForm(props: Props) {
  const [question, setQuestion] = createSignal("");
  const [options, setOptions] = createSignal<string[]>(
    Array.from({ length: MIN_OPTIONS }, () => ""),
  );
  const [duration, setDuration] = createSignal<number>(DEFAULT_DURATION);
  const limits = () => VOTE_LIMITS[props.kind];

  const setOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  function start(): Promise<void> {
    const base = {
      broadcasterId: props.broadcasterId,
      title: question().trim(),
    };
    const choices = filledOptions(options());
    return props.kind === "poll"
      ? createPoll({ ...base, choices, durationSeconds: duration() })
      : createPrediction({
          ...base,
          outcomes: choices,
          windowSeconds: duration(),
        });
  }

  return (
    <ToolForm
      title={t(COPY[props.kind].title)}
      submitLabel={t(COPY[props.kind].submit)}
      canSubmit={canStartVote(question(), options())}
      onSubmit={() =>
        start()
          .then(props.onDone)
          .catch(() => {})
      }
      onCancel={props.onDone}
    >
      <FormField label={t("HEADER_QUESTION_LABEL")}>
        <Field
          ref={autofocus}
          aria-label={t("HEADER_QUESTION_LABEL")}
          placeholder={t("HEADER_QUESTION_PLACEHOLDER")}
          maxLength={limits().titleLength}
          value={question()}
          onInput={(e) => setQuestion(e.currentTarget.value)}
        />
      </FormField>
      <FormField label={t("HEADER_OPTIONS_LABEL")}>
        <div class="flex flex-col gap-1.5">
          <Index each={options()}>
            {(option, i) => {
              const label = t("HEADER_OPTION_LABEL", { number: i + 1 });
              return (
                <div class="enter-rise">
                  <Field
                    aria-label={label}
                    placeholder={label}
                    maxLength={OPTION_LENGTH}
                    value={option()}
                    onInput={(e) => setOption(i, e.currentTarget.value)}
                  />
                </div>
              );
            }}
          </Index>
        </div>
      </FormField>
      <Show when={options().length < limits().options}>
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus class="size-4" />}
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            {t("HEADER_ADD_OPTION_LABEL")}
          </Button>
        </div>
      </Show>
      <FormField label={t(COPY[props.kind].time)}>
        <Segmented
          label={t(COPY[props.kind].time)}
          fill
          value={String(duration())}
          options={VOTE_DURATIONS.map((seconds) => ({
            value: String(seconds),
            label: formatDuration(seconds),
          }))}
          onChange={(value) => setDuration(Number(value))}
        />
      </FormField>
    </ToolForm>
  );
}
