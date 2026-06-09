import type { User } from "../../lib/types/twitch/user.ts";
import DashboardGreeting from "./DashboardGreeting.tsx";
import LiveNow from "./LiveNow.tsx";

type Props = {
  onSelectChannel: (channel: User) => void;
};

export default function Dashboard(props: Props) {
  return (
    <div class="@container min-w-0 flex-1 min-h-0 overflow-y-auto bg-bg-dark">
      <div class="mx-auto max-w-[1280px] px-4 pb-14 pt-5 @[760px]:px-8 @[760px]:pt-7">
        <DashboardGreeting />
        <LiveNow onSelect={props.onSelectChannel} />
      </div>
    </div>
  );
}
