import { t } from "../i18n/index.ts";
import type { ChatState } from "../types/index.ts";
import { errorMessage } from "../utils/error.ts";

type ConnectFailure = Extract<
  ChatState,
  { type: "rejected" | "failed" | "capped" }
>;

export function connectFailure(state: ConnectFailure): string {
  switch (state.type) {
    case "rejected":
      return t("FEED_CONNECT_FAILED_LINE", { error: state.message });
    case "failed":
      return t("FEED_CONNECT_FAILED_LINE", {
        error: errorMessage(state.error),
      });
    case "capped":
      return t("FEED_CONNECT_CAPPED_LINE", {
        connections: state.connections,
        perConnection: state.perConnection,
      });
  }
}
