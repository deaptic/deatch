export type PopupState = { connected: boolean };

export type TabMessage =
  | { type: "claim-bonus" }
  | { type: "claim-drops"; request: string | null }
  | {
      type: "redeem";
      reward: unknown;
      cost: unknown;
      text: unknown;
      request: unknown;
    };
