import { assertEquals } from "@std/assert";
import { envelope, parseEnvelope } from "./protocol.ts";

Deno.test("splits the feature from the body", () => {
  assertEquals(
    parseEnvelope(JSON.stringify({ feature: "presence", type: "x", a: 1 })),
    { feature: "presence", body: { type: "x", a: 1 } },
  );
});

Deno.test("rejects anything without a feature", () => {
  for (
    const raw of [
      "nope",
      new ArrayBuffer(1),
      JSON.stringify(null),
      JSON.stringify({ type: "x" }),
      JSON.stringify({ feature: "" }),
    ]
  ) {
    assertEquals(parseEnvelope(raw), null);
  }
});

Deno.test("envelope round-trips", () => {
  assertEquals(parseEnvelope(envelope("f", { type: "t" })), {
    feature: "f",
    body: { type: "t" },
  });
});
