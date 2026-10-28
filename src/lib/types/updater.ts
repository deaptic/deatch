export type Update = {
  version: string;
  install: () => Promise<void>;
};
