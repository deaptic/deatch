import { expect, test } from "vite-plus/test";
import { effectiveAudio, readAudio } from "./settings.ts";

test("stored channel volumes are clamped and unchanged ones dropped", () => {
  expect(
    readAudio({
      gains: { broadcaster1: 9, broadcaster2: 1, broadcaster3: "x" },
    }).gains,
  ).toEqual({ broadcaster1: 2 });
});

test("a feature switched off stops its effect but keeps what was set", () => {
  const audio = {
    ...readAudio({ gains: { broadcaster1: 1.5 } }),
    enabled: true,
  };
  const off = effectiveAudio(audio, {
    gainControl: false,
    compressorControl: false,
  });
  expect(off.enabled).toBe(false);
  expect(off.gains).toEqual({});
  expect(audio.gains).toEqual({ broadcaster1: 1.5 });
  expect(
    effectiveAudio(audio, { gainControl: true, compressorControl: true }),
  ).toEqual(audio);
});
