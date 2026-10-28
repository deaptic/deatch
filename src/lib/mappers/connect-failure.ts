import { t } from "../i18n/index.ts";
import type { ChatState } from "../types/index.ts";
import { errorMessage } from "../utils/error.ts";

export type ConnectFailure = Extract<
  ChatState,
  { type: "rejected" | "failed" | "capped" }
>;

/// The notice for a channel whose chat could not be joined.
export function connectFailure(state: ConnectFailure): string {
  switch (state.type) {
    case "rejected":
      return t("CHAT_CONNECT_FAILED", { error: state.message });
    case "failed":
      return t("CHAT_CONNECT_FAILED", { error: errorMessage(state.error) });
    case "capped":
      return t("CHAT_CONNECT_CAPPED", {
        connections: state.connections,
        perConnection: state.perConnection,
      });
  }
}
