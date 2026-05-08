import ChannelList, { Channel } from "./components/ChannelList";

export type { Channel };

type Props = {
  onSelect: (ch: Channel) => void;
  selectedId: string | null;
  collapsed?: boolean;
};

export default function Sidebar(props: Props) {
  return (
    <aside class="flex flex-col flex-1 bg-[#1f1f23] border-r border-[#2d2d35] overflow-hidden">
      <ChannelList onSelect={props.onSelect} selectedId={props.selectedId} collapsed={props.collapsed} />
    </aside>
  );
}
