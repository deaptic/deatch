import { createResource, For, Match, Switch } from "solid-js";
import { t } from "../../shared/i18n/index.ts";
import { domainOf } from "../../shared/domain.ts";
import { addTrustedDomain } from "../preferences/index.ts";
import HiddenImage from "../../kit/HiddenImage.tsx";
import LinkCard from "../../kit/LinkCard.tsx";
import Button from "../../kit/Button.tsx";
import * as previews from "./store.ts";

export default function LinkPreviews(props: { urls: string[] }) {
  return (
    <div class="mt-1.5 flex flex-col gap-1.5">
      <For each={props.urls}>{(url) => <LinkPreview url={url} />}</For>
    </div>
  );
}

function LinkPreview(props: { url: string }) {
  const [preview] = createResource(
    () => previews.isTrusted(props.url) && props.url,
    previews.get,
  );
  const card = () => {
    const p = preview();
    return p?.kind === "card" ? p : undefined;
  };
  const image = () => {
    const p = preview();
    return p?.kind === "image" ? p : undefined;
  };
  const bareLink = () => props.url.replace(/^https?:\/\/(www\.)?/, "");
  const untrustedDomain = () =>
    previews.isTrusted(props.url) ? null : domainOf(props.url);
  const bareDomain = () =>
    preview.state === "ready" && preview() === null
      ? domainOf(props.url)
      : null;
  return (
    <Switch>
      <Match when={untrustedDomain()}>
        {(domain) => (
          <LinkCard
            site={domain()}
            title={bareLink()}
            onOpen={() => previews.open(props.url)}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addTrustedDomain(domain())}
              >
                {t("FEED_LINK_TRUST_LABEL")}
              </Button>
            }
          />
        )}
      </Match>
      <Match when={card()}>
        {(card) => (
          <LinkCard
            site={card().site}
            title={card().title}
            description={card().description}
            thumbnail={card().thumbnail}
            video={card().video}
            onOpen={() => previews.open(props.url)}
          />
        )}
      </Match>
      <Match when={bareDomain()}>
        {(domain) => (
          <LinkCard
            site={domain()}
            title={bareLink()}
            onOpen={() => previews.open(props.url)}
          />
        )}
      </Match>
      <Match when={image()}>
        {(image) => (
          <HiddenImage
            src={image().url}
            label={t("FEED_LINK_IMAGE_SHOW_LABEL", { site: image().site })}
          />
        )}
      </Match>
    </Switch>
  );
}
