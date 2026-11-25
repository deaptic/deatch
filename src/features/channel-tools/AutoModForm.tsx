import { createSignal, For, onMount, Show } from "solid-js";
import { type MessageKey, t } from "../../shared/i18n/index.ts";
import {
  getAutomodSettings,
  updateAutomodSettings,
} from "../../platform/twitch/moderation.ts";
import type {
  AutoModChange,
  AutoModLevels,
  AutoModSettings,
} from "../../shared/types/index.ts";
import type { Steps } from "../../shared/accessibility.ts";
import { at } from "../../shared/at.ts";
import FormDialog from "../../kit/FormDialog.tsx";
import LabeledField from "../../kit/LabeledField.tsx";
import Loading from "../../kit/Loading.tsx";
import Segmented from "../../kit/Segmented.tsx";
import StepSlider from "../../kit/StepSlider.tsx";

const LEVELS: Steps = [0, 1, 2, 3, 4];

const CATEGORIES: [keyof AutoModLevels, MessageKey][] = [
  ["aggression", "AUTOMOD_AGGRESSION_LABEL"],
  ["bullying", "AUTOMOD_BULLYING_LABEL"],
  ["disability", "AUTOMOD_DISABILITY_LABEL"],
  ["misogyny", "AUTOMOD_MISOGYNY_LABEL"],
  ["raceEthnicityOrReligion", "AUTOMOD_RACE_LABEL"],
  ["sexBasedTerms", "AUTOMOD_SEX_BASED_TERMS_LABEL"],
  ["sexualitySexOrGender", "AUTOMOD_SEXUALITY_LABEL"],
  ["swearing", "AUTOMOD_SWEARING_LABEL"],
];

const CUSTOM = "custom";

const LEVEL_KEYS: MessageKey[] = [
  "AUTOMOD_LEVEL_OFF_VALUE",
  "AUTOMOD_LEVEL_LOW_VALUE",
  "AUTOMOD_LEVEL_MEDIUM_VALUE",
  "AUTOMOD_LEVEL_HIGH_VALUE",
  "AUTOMOD_LEVEL_STRICT_VALUE",
];

const levelText = (level: number) => t(at(LEVEL_KEYS, level));

function changeOf(settings: AutoModSettings): AutoModChange {
  return settings.overallLevel === null
    ? { kind: "levels", levels: settings.levels }
    : { kind: "overall", level: settings.overallLevel };
}

type Props = {
  broadcasterId: string;
  onDone: () => void;
};

export default function AutoModForm(props: Props) {
  const [settings, setSettings] = createSignal<AutoModSettings | null>(null);
  const [saving, setSaving] = createSignal(false);

  onMount(() =>
    getAutomodSettings({ broadcasterId: props.broadcasterId })
      .then(setSettings)
      .catch(props.onDone),
  );

  const setOverall = (value: string) =>
    setSettings(
      (s) =>
        s && { ...s, overallLevel: value === CUSTOM ? null : Number(value) },
    );
  const setLevel = (key: keyof AutoModLevels, level: number) =>
    setSettings(
      (s) => s && { overallLevel: null, levels: { ...s.levels, [key]: level } },
    );

  function save() {
    const current = settings();
    if (!current) return;
    setSaving(true);
    updateAutomodSettings({
      broadcasterId: props.broadcasterId,
      change: changeOf(current),
    })
      .then(props.onDone)
      .catch(() => setSaving(false));
  }

  return (
    <FormDialog
      title={t("AUTOMOD_TITLE")}
      description={t("AUTOMOD_DESCRIPTION")}
      submitLabel={t("HEADER_SAVE_AUTOMOD_LABEL")}
      canSubmit={settings() !== null && !saving()}
      onSubmit={save}
      onClose={props.onDone}
    >
      <Show when={settings()} fallback={<Loading />}>
        {(s) => (
          <>
            <LabeledField label={t("AUTOMOD_OVERALL_LABEL")}>
              <Segmented
                label={t("AUTOMOD_OVERALL_LABEL")}
                fill
                value={s().overallLevel?.toString() ?? CUSTOM}
                options={[
                  ...LEVELS.map((level) => ({
                    value: level.toString(),
                    label: levelText(level),
                  })),
                  { value: CUSTOM, label: t("AUTOMOD_CUSTOM_VALUE") },
                ]}
                onChange={setOverall}
              />
            </LabeledField>
            <Show when={s().overallLevel === null}>
              <div class="flex flex-col gap-3">
                <For each={CATEGORIES}>
                  {([key, label]) => (
                    <LabeledField label={t(label)}>
                      <StepSlider
                        label={t(label)}
                        value={s().levels[key]}
                        steps={LEVELS}
                        format={levelText}
                        onChange={(level) => setLevel(key, level)}
                      />
                    </LabeledField>
                  )}
                </For>
              </div>
            </Show>
          </>
        )}
      </Show>
    </FormDialog>
  );
}
