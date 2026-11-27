import { Users } from "lucide-solid";
import type { Stream, User } from "../../shared/types/index.ts";
import { resolveUser } from "../channels/index.ts";
import { formatCount } from "../../shared/format/stream.ts";
import { createChannelLink } from "../menus/index.ts";
import PreviewTile from "./PreviewTile.tsx";

type Props = {
  stream: Stream;
  thumbnailVersion: number;
  onSelect: (channel: User) => void;
};

export default function StreamTile(props: Props) {
  const channel = () => resolveUser(props.stream.user);
  const link = createChannelLink(channel, () => props.onSelect(channel()));

  return (
    <PreviewTile
      {...link.handlers}
      cursor={link.cursor}
      src={`${props.stream.thumbnailUrl}?v=${props.thumbnailVersion}`}
      icon={<Users />}
      value={formatCount(props.stream.viewerCount)}
      title={channel().displayName}
      subtitle={props.stream.game.name}
      tip={props.stream.title}
    >
      {link.menu()}
    </PreviewTile>
  );
}
