import { type JSX, splitProps } from "solid-js";
import Thumbnail from "../../kit/Thumbnail.tsx";
import CardButton from "../../kit/CardButton.tsx";
import Stat from "../../kit/Stat.tsx";
import Text from "../../kit/Text.tsx";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  src: string;
  icon: JSX.Element;
  value: string;
  title: string;
  subtitle: string;
  tip: string;
  cursor?: string;
};

export default function PreviewTile(props: Props) {
  const [local, button] = splitProps(props, [
    "src",
    "icon",
    "value",
    "title",
    "subtitle",
    "tip",
    "cursor",
    "children",
  ]);
  return (
    <CardButton variant="insetTile" cursor={local.cursor} {...button}>
      <Thumbnail src={local.src} shape="video" fit="bleed">
        <span class="absolute right-1.5 bottom-1.5">
          <Text size="sm">
            <Stat tone="media" icon={local.icon} value={local.value} />
          </Text>
        </span>
      </Thumbnail>
      <div class="w-full min-w-0 flex flex-col" data-tip={local.tip}>
        <Text size="sm" bold tone="primary" align="left" truncate>
          {local.title}
        </Text>
        <Text size="xs" tone="soft" align="left" truncate>
          {local.subtitle}
        </Text>
      </div>
      {local.children}
    </CardButton>
  );
}
