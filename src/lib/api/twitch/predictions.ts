import { commands } from "../../bindings.ts";
import type {
  BroadcasterParams,
  CreatePredictionParams,
  EndPredictionParams,
  Prediction,
  PredictionEnd,
} from "../../types/index.ts";
import { invokeCommand, type InvokeOptions } from "../utils.ts";
import { type MessageKey, t } from "../../i18n/index.ts";

const ENDED: Record<PredictionEnd["kind"], MessageKey> = {
  lock: "TOAST_PREDICTION_LOCKED",
  resolve: "TOAST_PREDICTION_RESOLVED",
  cancel: "TOAST_PREDICTION_REFUNDED",
};

export function getActivePrediction(
  params: BroadcasterParams,
  options?: InvokeOptions,
): Promise<Prediction | null> {
  return invokeCommand(commands.getActivePrediction, [params], options);
}

export async function createPrediction(
  params: CreatePredictionParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.createPrediction, [params], {
    successMessage: t("TOAST_PREDICTION_STARTED"),
    ...options,
  });
}

export async function endPrediction(
  params: EndPredictionParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand(commands.endPrediction, [params], {
    successMessage: t(ENDED[params.end.kind]),
    ...options,
  });
}
