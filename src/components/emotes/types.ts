export type EmoteGridItem = {
  value: string;
  url: string;
  label: string;
  /** Shown but not insertable, like a favourite this channel lacks. */
  disabled?: boolean;
};
