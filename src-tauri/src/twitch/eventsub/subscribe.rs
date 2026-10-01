use super::super::Authed;
use super::events::{EventSubSubscription, SubscriptionStatus};
use super::EventKind;
use crate::emit::emit;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use twitch_api::eventsub::{
    automod::message::{hold::AutomodMessageHoldV2, update::AutomodMessageUpdateV2},
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{
        ChannelFollowV2, ChannelModerateV2, ChannelPointsCustomRewardRedemptionAddV1,
        ChannelShoutoutCreateV1, ChannelUpdateV2,
    },
    Transport,
};

pub(super) async fn create_subscription(
    app: &tauri::AppHandle,
    twitch: &Authed<'_>,
    broadcaster_id: &str,
    kind: EventKind,
    session_id: &str,
    quiet: bool,
) -> Option<String> {
    let user_id = twitch.token.user_id.as_str();
    let transport = Transport::websocket(session_id);

    let result = match kind {
        EventKind::ChannelChatMessage => {
            create(
                twitch,
                ChannelChatMessageV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatNotification => {
            create(
                twitch,
                ChannelChatNotificationV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatMessageDelete => {
            create(
                twitch,
                ChannelChatMessageDeleteV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatClear => {
            create(
                twitch,
                ChannelChatClearV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatClearUserMessages => {
            create(
                twitch,
                ChannelChatClearUserMessagesV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelShoutoutCreate => {
            create(
                twitch,
                ChannelShoutoutCreateV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelFollow => {
            create(
                twitch,
                ChannelFollowV2::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelModerate => {
            create(
                twitch,
                ChannelModerateV2::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::AutomodMessageHold => {
            create(
                twitch,
                AutomodMessageHoldV2::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::AutomodMessageUpdate => {
            create(
                twitch,
                AutomodMessageUpdateV2::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelPointsCustomRewardRedemptionAdd => {
            create(
                twitch,
                ChannelPointsCustomRewardRedemptionAddV1::broadcaster_user_id(broadcaster_id),
                transport,
            )
            .await
        }
        EventKind::ChannelUpdate => {
            create(
                twitch,
                ChannelUpdateV2::broadcaster_user_id(broadcaster_id),
                transport,
            )
            .await
        }
    };

    match result {
        Ok(id) => {
            log::info!("subscribed kind={kind:?} broadcaster={broadcaster_id} quiet={quiet}");
            if !quiet {
                emit_status(app, broadcaster_id, kind, SubscriptionStatus::Subscribed);
            }
            Some(id)
        }
        Err(e) => {
            emit_failed(app, broadcaster_id, kind, e);
            None
        }
    }
}

pub(super) fn emit_status(
    app: &tauri::AppHandle,
    broadcaster_id: &str,
    kind: EventKind,
    status: SubscriptionStatus,
) {
    emit(
        app,
        EventSubSubscription {
            broadcaster_id: UserId::from(broadcaster_id),
            kind,
            status,
        },
    );
}

pub(super) fn emit_failed(
    app: &tauri::AppHandle,
    broadcaster_id: &str,
    kind: EventKind,
    error: Error,
) {
    log::warn!("subscribe-failed kind={kind:?} broadcaster={broadcaster_id} error={error}");
    emit_status(
        app,
        broadcaster_id,
        kind,
        SubscriptionStatus::Failed {
            error: error.to_string(),
        },
    );
}
async fn create<E>(twitch: &Authed<'_>, condition: E, transport: Transport) -> Result<String>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    let subscription = twitch
        .helix
        .create_eventsub_subscription(condition, transport, &twitch.token)
        .await?;
    Ok(subscription.id.to_string())
}

pub(super) async fn delete_subscription(twitch: &Authed<'_>, subscription_id: &str) -> Result<()> {
    twitch
        .helix
        .delete_eventsub_subscription(subscription_id, &twitch.token)
        .await?;
    Ok(())
}
