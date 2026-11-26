import { createResource, createSignal, For, onCleanup, Show } from "solid-js";
import { releases } from "../../shared/changelog.ts";
import { t } from "../../shared/i18n/index.ts";
import { open } from "../../platform/browser.ts";
import Button from "../../kit/Button.tsx";
import Divider from "../../kit/Divider.tsx";
import Page from "../../kit/Page.tsx";
import SectionTitle from "../../kit/SectionTitle.tsx";
import Text from "../../kit/Text.tsx";
import { loadChangelog } from "./load.ts";
import Notes from "./Notes.tsx";

const RELEASES_URL = "https://github.com/deaptic/deatch/releases";
const PAGE_SIZE = 5;

export default function Changelog() {
  const [all] = createResource(() => loadChangelog().then(releases));
  const [count, setCount] = createSignal(PAGE_SIZE);
  const shown = () => all()?.slice(0, count()) ?? [];

  const observer = new IntersectionObserver(
    (entries) => {
      const seen = entries.find((e) => e.isIntersecting);
      if (!seen) return;
      observer.unobserve(seen.target);
      setCount((c) => c + PAGE_SIZE);
    },
    { rootMargin: "400px" },
  );
  onCleanup(() => observer.disconnect());

  return (
    <Page>
      <div class="flex items-center gap-3 pb-2">
        <SectionTitle>{t("CHANGELOG_TITLE")}</SectionTitle>
        <span class="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => open(RELEASES_URL)}>
            {t("CHANGELOG_GITHUB_LABEL")}
          </Button>
        </span>
      </div>
      <For each={shown()}>
        {(release, i) => (
          <>
            <Show when={i() > 0}>
              <Divider class="my-6" />
            </Show>
            <article class="flex flex-col gap-3">
              <div class="flex items-baseline gap-2">
                <Text as="h3" size="sm" tone="accent" bold>
                  {t("CHANGELOG_RELEASE_TITLE", { version: release.version })}
                </Text>
                <Text size="sm" tone="faint">
                  {release.date}
                </Text>
              </div>
              <Notes notes={release.notes} />
            </article>
          </>
        )}
      </For>
      <Show when={count() < (all()?.length ?? 0) && count()} keyed>
        <div ref={(el) => observer.observe(el)} class="h-px" />
      </Show>
    </Page>
  );
}
