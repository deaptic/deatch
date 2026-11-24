import type { Fragment } from "../feed/index.ts";

const ENDS_WITH_LINK = /https?:\/\/\S*$/;

export function joinLinkMentions(fragments: Fragment[]): Fragment[] {
  const joined: Fragment[] = [];
  for (const fragment of fragments) {
    const previous = joined.at(-1);
    const continuesText =
      previous?.type === "text" &&
      (fragment.type === "text" ||
        (fragment.type === "mention" && ENDS_WITH_LINK.test(previous.text)));
    if (previous && continuesText) {
      joined[joined.length - 1] = {
        type: "text",
        text: previous.text + fragment.text,
      };
    } else {
      joined.push(fragment);
    }
  }
  return joined;
}
