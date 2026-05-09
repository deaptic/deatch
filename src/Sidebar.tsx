import ChannelList, { Channel } from "./components/ChannelList";

export type { Channel };

type Props = {
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  onPinnedChange?: (pinned: Channel[]) => void;
  onLiveChange?: (live: Channel[]) => void;
};

export default function Sidebar(props: Props) {
  return (
    <aside class="flex flex-col flex-1 bg-[#18181b] border-r border-[#2d2d35] overflow-hidden">
      <ChannelList
        onSelect={props.onSelect}
        selectedId={props.selectedId}
        onPinnedChange={props.onPinnedChange}
        onLiveChange={props.onLiveChange}
      />
    </aside>
  );
}
