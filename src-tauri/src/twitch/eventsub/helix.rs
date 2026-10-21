use futures_util::{stream, StreamExt};
use tokio::sync::mpsc;
use twitch_api::twitch_oauth2::UserToken;

use super::super::moderation::get_moderated_channels;
use super::super::{Authed, Twitch};
use super::runner::Signal;
use super::subscriptions::{Batch, CreateError, Created, Subscription};
use super::versions::ChannelPointsAutomaticRewardRedemptionAddV2;
use super::EventKind;
use crate::error::Result;
use crate::twitch::ids::UserId;
use twitch_api::eventsub::{
    automod::message::{hold::AutomodMessageHoldV2, update::AutomodMessageUpdateV2},
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{
        ChannelChatSettingsUpdateV1, ChannelFollowV2, ChannelModerateV2,
        ChannelPointsCustomRewardRedemptionAddV1, ChannelShoutoutCreateV1,
        ChannelShoutoutReceiveV1, ChannelUnbanRequestCreateV1, ChannelUnbanRequestResolveV1,
        ChannelUpdateV2, ChannelWarningAcknowledgeV1,
    },
    channel::{ChannelSharedChatBeginV1, ChannelSharedChatEndV1, ChannelSharedChatUpdateV1},
    stream::{StreamOfflineV1, StreamOnlineV1},
    Transport,
};
use twitch_api::helix::{ClientRequestError, HelixRequestPostError};

const MAX_CONCURRENT: usize = 20;

pub(super) fn spawn_creates(
    twitch: Twitch,
    token: UserToken,
    batch: Batch,
    signals: mpsc::UnboundedSender<Signal>,
) {
    tauri::async_runtime::spawn(async move {
        let authed = &twitch.with_token(token);
        let Batch {
            conn,
            session_id,
            generation,
            subscriptions,
        } = batch;
        let session_id = session_id.as_str();
        let results = stream::iter(subscriptions)
            .map(|subscription| async move {
                let result = create(authed, &subscription, session_id).await;
                Created {
                    conn,
                    generation,
                    subscription,
                    result,
                }
            })
            .buffer_unordered(MAX_CONCURRENT);
        let mut results = std::pin::pin!(results);
        while let Some(created) = results.next().await {
            if signals.send(Signal::Created(created)).is_err() {
                log::debug!("eventsub task stopped, dropping subscribe result");
                return;
            }
        }
    });
}

/// Runs off the coordinator so chat delivery never waits on Helix.
pub(super) fn spawn_moderated(
    twitch: Twitch,
    token: UserToken,
    signals: mpsc::UnboundedSender<Signal>,
) {
    tauri::async_runtime::spawn(async move {
        let viewer = UserId::from(token.user_id.as_str());
        let result = get_moderated_channels(&twitch.with_token(token)).await;
        if signals.send(Signal::Moderated { viewer, result }).is_err() {
            log::debug!("eventsub task stopped, dropping moderated channels");
        }
    });
}

pub(super) fn spawn_deletes(twitch: Twitch, stale: Vec<(Subscription, String)>) {
    if stale.is_empty() {
        return;
    }
    tauri::async_runtime::spawn(async move {
        let authed = match twitch.authed().await {
            Ok(authed) => authed,
            Err(e) => {
                log::warn!(
                    "no token to delete {} subscriptions, leaked remotely: {e}",
                    stale.len()
                );
                return;
            }
        };
        let authed = &authed;
        stream::iter(stale)
            .for_each_concurrent(MAX_CONCURRENT, |(subscription, sub_id)| async move {
                log::info!("unsubscribe {subscription}");
                if let Err(e) = delete(authed, &sub_id).await {
                    log::warn!("failed to delete subscription {sub_id}, leaked remotely: {e}");
                }
            })
            .await;
    });
}

async fn create(
    twitch: &Authed<'_>,
    subscription: &Subscription,
    session_id: &str,
) -> std::result::Result<String, CreateError> {
    let b = subscription.channel.as_str();
    let u = twitch.token.user_id.as_str();
    let transport = Transport::websocket(session_id);
    macro_rules! subscribe {
        ($condition:expr) => {
            send(twitch, $condition, transport).await
        };
    }
    match subscription.kind {
        EventKind::ChannelChatMessage => subscribe!(ChannelChatMessageV1::new(b, u)),
        EventKind::ChannelChatNotification => subscribe!(ChannelChatNotificationV1::new(b, u)),
        EventKind::ChannelChatMessageDelete => subscribe!(ChannelChatMessageDeleteV1::new(b, u)),
        EventKind::ChannelChatClear => subscribe!(ChannelChatClearV1::new(b, u)),
        EventKind::ChannelChatClearUserMessages => {
            subscribe!(ChannelChatClearUserMessagesV1::new(b, u))
        }
        EventKind::ChannelChatSettingsUpdate => subscribe!(ChannelChatSettingsUpdateV1::new(b, u)),
        EventKind::ChannelShoutoutCreate => subscribe!(ChannelShoutoutCreateV1::new(b, u)),
        EventKind::ChannelShoutoutReceive => subscribe!(ChannelShoutoutReceiveV1::new(b, u)),
        EventKind::ChannelFollow => subscribe!(ChannelFollowV2::new(b, u)),
        EventKind::ChannelModerate => subscribe!(ChannelModerateV2::new(b, u)),
        EventKind::ChannelUnbanRequestCreate => {
            subscribe!(ChannelUnbanRequestCreateV1::new(b, u))
        }
        EventKind::ChannelUnbanRequestResolve => {
            subscribe!(ChannelUnbanRequestResolveV1::new(b, u))
        }
        EventKind::ChannelWarningAcknowledge => {
            subscribe!(ChannelWarningAcknowledgeV1::new(b, u))
        }
        EventKind::AutomodMessageHold => subscribe!(AutomodMessageHoldV2::new(b, u)),
        EventKind::AutomodMessageUpdate => subscribe!(AutomodMessageUpdateV2::new(b, u)),
        EventKind::ChannelPointsCustomRewardRedemptionAdd => {
            subscribe!(ChannelPointsCustomRewardRedemptionAddV1::broadcaster_user_id(b))
        }
        EventKind::ChannelPointsAutomaticRewardRedemptionAdd => {
            subscribe!(ChannelPointsAutomaticRewardRedemptionAddV2 {
                broadcaster_user_id: b.into()
            })
        }
        EventKind::ChannelUpdate => subscribe!(ChannelUpdateV2::broadcaster_user_id(b)),
        EventKind::ChannelSharedChatBegin => {
            subscribe!(ChannelSharedChatBeginV1::broadcaster_user_id(b))
        }
        EventKind::ChannelSharedChatUpdate => {
            subscribe!(ChannelSharedChatUpdateV1::broadcaster_user_id(b))
        }
        EventKind::ChannelSharedChatEnd => {
            subscribe!(ChannelSharedChatEndV1::broadcaster_user_id(b))
        }
        EventKind::StreamOnline => subscribe!(StreamOnlineV1::broadcaster_user_id(b)),
        EventKind::StreamOffline => subscribe!(StreamOfflineV1::broadcaster_user_id(b)),
    }
}

async fn send<E>(
    twitch: &Authed<'_>,
    condition: E,
    transport: Transport,
) -> std::result::Result<String, CreateError>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    match twitch
        .helix
        .create_eventsub_subscription(condition, transport, &twitch.token)
        .await
    {
        Ok(subscription) => Ok(subscription.id.to_string()),
        Err(ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
            status,
            message,
            ..
        })) if is_rejection(status) => Err(CreateError::Rejected(message)),
        Err(e) => Err(CreateError::Transient(e.into())),
    }
}

async fn delete(twitch: &Authed<'_>, subscription_id: &str) -> Result<()> {
    twitch
        .helix
        .delete_eventsub_subscription(subscription_id, &twitch.token)
        .await?;
    Ok(())
}

fn is_rejection(status: http::StatusCode) -> bool {
    use http::StatusCode;
    status.is_client_error()
        && status != StatusCode::TOO_MANY_REQUESTS
        && status != StatusCode::UNAUTHORIZED
}

#[cfg(test)]
mod tests {
    use super::is_rejection;
    use http::StatusCode;

    #[test]
    fn only_final_client_errors_reject() {
        for status in [
            StatusCode::BAD_REQUEST,
            StatusCode::FORBIDDEN,
            StatusCode::CONFLICT,
        ] {
            assert!(is_rejection(status), "{status}");
        }
        for status in [
            StatusCode::UNAUTHORIZED,
            StatusCode::TOO_MANY_REQUESTS,
            StatusCode::INTERNAL_SERVER_ERROR,
        ] {
            assert!(!is_rejection(status), "{status}");
        }
    }
}
