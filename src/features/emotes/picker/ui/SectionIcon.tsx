import { Clock, Star } from "lucide-solid";
import { Match, Switch } from "solid-js";
import ProviderIcon, { providerOf } from "./ProviderIcon.tsx";

type Props = {
  sectionId: string;
  avatarUrl?: string;
  fallbackUrl?: string;
};

export default function SectionIcon(props: Props) {
  const provider = () => providerOf(props.sectionId);
  return (
    <Switch
      fallback={
        <img
          src={props.avatarUrl ?? props.fallbackUrl}
          alt=""
          loading="lazy"
          class={
            props.avatarUrl
              ? "size-8 rounded-xs object-cover"
              : "size-7 object-contain"
          }
        />
      }
    >
      <Match when={props.sectionId === "favorites"}>
        <Star />
      </Match>
      <Match when={props.sectionId === "frequent"}>
        <Clock />
      </Match>
      <Match when={provider()}>{(p) => <ProviderIcon provider={p()} />}</Match>
    </Switch>
  );
}
