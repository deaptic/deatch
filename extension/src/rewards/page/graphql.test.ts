import { expect, test } from "vite-plus/test";
import { mutation, query } from "./graphql.ts";

type Printed = { loc: { end: number; source: { body: string } } };

const bodyOf = (document: object) => (document as Printed).loc.source.body;

test("a mutation passes its input variable to the root field", () => {
  const document = mutation("Claim", "ClaimInput", { claim: { status: true } });
  expect(document).toMatchObject({
    definitions: [
      {
        variableDefinitions: [{ variable: { name: { value: "input" } } }],
        selectionSet: {
          selections: [
            {
              arguments: [
                { name: { value: "input" }, value: { kind: "Variable" } },
              ],
            },
          ],
        },
      },
    ],
  });
});

test("every document carries its query text, so Twitch can run it", () => {
  const claim = mutation("Claim", "ClaimInput", { claim: { status: true } });
  expect(bodyOf(claim)).toBe(
    "mutation Claim($input: ClaimInput!) { claim(input: $input) { status } }",
  );
  expect((claim as Printed).loc.end).toBe(bodyOf(claim).length);
});

test("a query prints and builds its literal arguments", () => {
  const document = query("Session", {
    currentUser: {
      session: { args: { channelID: "24138907" }, select: { minutes: true } },
    },
  });
  expect(bodyOf(document)).toBe(
    'query Session { currentUser { session(channelID: "24138907") { minutes } } }',
  );
  expect(document).toMatchObject({
    definitions: [
      {
        variableDefinitions: [],
        selectionSet: {
          selections: [
            {
              arguments: [],
              selectionSet: {
                selections: [
                  {
                    arguments: [
                      {
                        name: { value: "channelID" },
                        value: { kind: "StringValue", value: "24138907" },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  });
});
