import * as activity from "../activity/index.ts";
import { For, Show } from "solid-js";
import Transition from "../../kit/Transition.tsx";
import type { FeedApi } from "../feed/index.ts";
import {
  EventContextMenu,
  MessageContextMenu,
  UserContextMenu,
} from "../menus/index.ts";
import { BanModal, UserCard, WarnModal } from "../user-card/index.ts";
import { users } from "../users/index.ts";
import {
  advancedDeveloperMode,
  feedShowCopypasta,
} from "../preferences/index.ts";
import type { FeedMessage } from "../feed/index.ts";
import type { ChatOverlays as Overlays } from "./createChatOverlays.ts";

type Props = {
  overlays: Overlays;
  broadcasterId: string;
  broadcasterLogin: string;
  isMod: boolean;
  feed: FeedApi | null;
  onReply: (msg: FeedMessage) => void;
  onCopypasta: (msg: FeedMessage) => void;
  onMention: (login: string) => void;
  onJumpToMessage: (messageId: string) => void;
  onOpenChannel: (broadcasterId: string) => void;
};

export default function ChatOverlays(props: Props) {
  const o = () => props.overlays;
  const closeModAction = () => o().setModAction(null);
  return (
    <>
      <Show when={o().messageMenu.state()}>
        {(cm) => (
          <MessageContextMenu
            x={cm().x}
            y={cm().y}
            msg={cm().msg}
            isMod={props.isMod}
            broadcasterId={props.broadcasterId}
            developerMode={advancedDeveloperMode()}
            showCopypasta={feedShowCopypasta()}
            onClose={o().messageMenu.close}
            onReply={props.onReply}
            onCopypasta={props.onCopypasta}
            onJumpToMessage={props.onJumpToMessage}
            pinned={
              activity.forChannel(props.broadcasterId).pinned?.messageId ===
              cm().msg.message_id
            }
            onPin={(seconds) =>
              activity.pin(props.broadcasterId, cm().msg.message_id, seconds)
            }
            onUnpin={() =>
              activity.unpin(props.broadcasterId, cm().msg.message_id)
            }
          />
        )}
      </Show>
      <Show when={o().userMenu.state()}>
        {(uc) => (
          <UserContextMenu
            x={uc().x}
            y={uc().y}
            userId={uc().userId}
            userLogin={uc().userLogin}
            userDisplayName={uc().userDisplayName}
            isMod={props.isMod}
            broadcasterId={props.broadcasterId}
            developerMode={advancedDeveloperMode()}
            onClose={o().userMenu.close}
            onModerate={(action, target) =>
              o().setModAction({ action, ...target })
            }
            onShowProfile={(x, y, userId) => o().userCards.open(x, y, userId)}
            onMention={props.onMention}
          />
        )}
      </Show>
      <For each={o().userCards.cards}>
        {(card) => (
          <UserCard
            x={card.x}
            y={card.y}
            chatterId={card.chatterId}
            broadcasterId={props.broadcasterId}
            broadcasterLogin={props.broadcasterLogin}
            pinned={card.pinned}
            getBounds={() => props.feed?.getBounds() ?? null}
            getBoundsElement={() => props.feed?.getElement() ?? null}
            onClose={() => o().userCards.close(card.key)}
            onTogglePin={() =>
              o().userCards.update(card.key, { pinned: !card.pinned })
            }
            onJumpToMessage={props.onJumpToMessage}
            onOpenChannel={props.onOpenChannel}
            onUserContextMenu={o().openUserMenu}
            onSwitchUser={async (identity) => {
              const id = await users.resolveId(identity);
              if (id) o().userCards.update(card.key, { chatterId: id });
            }}
          />
        )}
      </For>
      <Show when={o().eventMenu.state()}>
        {(cm) => (
          <EventContextMenu
            x={cm().x}
            y={cm().y}
            item={cm().item}
            developerMode={advancedDeveloperMode()}
            onClose={o().eventMenu.close}
          />
        )}
      </Show>
      <Transition when={o().modAction()}>
        {(ma) => (
          <Show
            when={ma().action !== "warn"}
            fallback={
              <WarnModal
                userId={ma().userId}
                userName={ma().userName}
                broadcasterId={props.broadcasterId}
                onClose={closeModAction}
              />
            }
          >
            <BanModal
              userId={ma().userId}
              userName={ma().userName}
              broadcasterId={props.broadcasterId}
              onClose={closeModAction}
            />
          </Show>
        )}
      </Transition>
    </>
  );
}
