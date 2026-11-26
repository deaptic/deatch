export const loadChangelog = (): Promise<string> =>
  import("../../../CHANGELOG.md?raw").then((m) => m.default);
