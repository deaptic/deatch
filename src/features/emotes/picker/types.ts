export type EmoteGridItem = {
  value: string;
  url: string;
  label: string;
  disabled?: boolean;
  scope?: "channel" | "global";
};
