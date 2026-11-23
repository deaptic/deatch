import { commands } from "../bindings.ts";
import type {
  BroadcasterParams,
  CreatePredictionParams,
  EndPredictionParams,
  Prediction,
  PredictionEnd,
} from "../../shared/types/index.ts";
import { invokeCommand, type InvokeOptions } from "../invoke.ts";
import { type MessageKey, t } from "../../shared/i18n/index.ts";

const ENDED: Record<PredictionEnd["kind"], MessageKey> = {
  lock: "HEADER_PREDICTION_LOCKED_TOAST",
  resolve: "HEADER_PREDICTION_RESOLVED_TOAST",
  cancel: "HEADER_PREDICTION_REFUNDED_TOAST",
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
    successMessage: t("HEADER_PREDICTION_STARTED_TOAST"),
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
