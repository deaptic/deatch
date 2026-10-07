use futures_util::{stream, StreamExt};
use tokio::sync::mpsc;
use twitch_api::twitch_oauth2::UserToken;

use super::super::{Authed, Twitch};
use super::runner::Signal;
use super::subscriptions::{Batch, Created, Subscription};
use super::EventKind;
use crate::error::Result;
use twitch_api::eventsub::{
    automod::message::{hold::AutomodMessageHoldV2, update::AutomodMessageUpdateV2},
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{
        ChannelChatSettingsUpdateV1, ChannelFollowV2, ChannelModerateV2,
        ChannelPointsCustomRewardRedemptionAddV1, ChannelShoutoutCreateV1, ChannelUpdateV2,
    },
    Transport,
};

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
) -> Result<String> {
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
        EventKind::ChannelFollow => subscribe!(ChannelFollowV2::new(b, u)),
        EventKind::ChannelModerate => subscribe!(ChannelModerateV2::new(b, u)),
        EventKind::AutomodMessageHold => subscribe!(AutomodMessageHoldV2::new(b, u)),
        EventKind::AutomodMessageUpdate => subscribe!(AutomodMessageUpdateV2::new(b, u)),
        EventKind::ChannelPointsCustomRewardRedemptionAdd => {
            subscribe!(ChannelPointsCustomRewardRedemptionAddV1::broadcaster_user_id(b))
        }
        EventKind::ChannelUpdate => subscribe!(ChannelUpdateV2::broadcaster_user_id(b)),
    }
}

async fn send<E>(twitch: &Authed<'_>, condition: E, transport: Transport) -> Result<String>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    let subscription = twitch
        .helix
        .create_eventsub_subscription(condition, transport, &twitch.token)
        .await?;
    Ok(subscription.id.to_string())
}

async fn delete(twitch: &Authed<'_>, subscription_id: &str) -> Result<()> {
    twitch
        .helix
        .delete_eventsub_subscription(subscription_id, &twitch.token)
        .await?;
    Ok(())
}
