use futures_util::{stream, StreamExt, TryStreamExt};
use serde_json::Value;
use tokio::sync::mpsc;
use twitch_api::twitch_oauth2::UserToken;

use super::super::moderation::get_moderated_channels;
use super::super::{Authed, Twitch};
use super::runner::Signal;
use super::subscriptions::{Batch, CreateError, Created, Subscription};
use super::versions::{
    ChannelHypeTrainBeginV2, ChannelHypeTrainEndV2, ChannelHypeTrainProgressV2,
    ChannelPointsAutomaticRewardRedemptionAddV2,
};
use super::EventKind;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use twitch_api::eventsub::{
    automod::message::{hold::AutomodMessageHoldV2, update::AutomodMessageUpdateV2},
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{ChannelAdBreakBeginV1, ChannelBitsUseV1, ChannelGoalBeginV1, ChannelGoalEndV1},
    channel::{ChannelCharityCampaignStartV1, ChannelCharityCampaignStopV1},
    channel::{
        ChannelChatSettingsUpdateV1, ChannelFollowV2, ChannelModerateV2,
        ChannelPointsCustomRewardRedemptionAddV1, ChannelShoutoutCreateV1,
        ChannelShoutoutReceiveV1, ChannelSuspiciousUserMessageV1, ChannelSuspiciousUserUpdateV1,
        ChannelUnbanRequestCreateV1, ChannelUnbanRequestResolveV1, ChannelUpdateV2,
        ChannelWarningAcknowledgeV1,
    },
    channel::{ChannelPollBeginV1, ChannelPollEndV1},
    channel::{ChannelPredictionBeginV1, ChannelPredictionEndV1, ChannelPredictionLockV1},
    channel::{ChannelSharedChatBeginV1, ChannelSharedChatEndV1, ChannelSharedChatUpdateV1},
    stream::{StreamOfflineV1, StreamOnlineV1},
    EventSubSubscription, Status, Transport, TransportResponse,
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
        let viewer = UserId::from(&token);
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
    macro_rules! subscribe {
        ($condition:expr) => {
            send(twitch, $condition, session_id).await
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
        EventKind::ChannelSuspiciousUserMessage => {
            subscribe!(ChannelSuspiciousUserMessageV1::new(b, u))
        }
        EventKind::ChannelSuspiciousUserUpdate => {
            subscribe!(ChannelSuspiciousUserUpdateV1::new(b, u))
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
        EventKind::ChannelHypeTrainBegin => subscribe!(ChannelHypeTrainBeginV2 {
            broadcaster_user_id: b.into()
        }),
        EventKind::ChannelHypeTrainProgress => subscribe!(ChannelHypeTrainProgressV2 {
            broadcaster_user_id: b.into()
        }),
        EventKind::ChannelHypeTrainEnd => subscribe!(ChannelHypeTrainEndV2 {
            broadcaster_user_id: b.into()
        }),
        EventKind::ChannelPollBegin => subscribe!(ChannelPollBeginV1::broadcaster_user_id(b)),
        EventKind::ChannelPollEnd => subscribe!(ChannelPollEndV1::broadcaster_user_id(b)),
        EventKind::ChannelPredictionBegin => {
            subscribe!(ChannelPredictionBeginV1::broadcaster_user_id(b))
        }
        EventKind::ChannelPredictionLock => {
            subscribe!(ChannelPredictionLockV1::broadcaster_user_id(b))
        }
        EventKind::ChannelPredictionEnd => {
            subscribe!(ChannelPredictionEndV1::broadcaster_user_id(b))
        }
        EventKind::ChannelGoalBegin => subscribe!(ChannelGoalBeginV1::broadcaster_user_id(b)),
        EventKind::ChannelGoalEnd => subscribe!(ChannelGoalEndV1::broadcaster_user_id(b)),
        EventKind::ChannelAdBreakBegin => {
            subscribe!(ChannelAdBreakBeginV1::broadcaster_user_id(b))
        }
        EventKind::ChannelBitsUse => subscribe!(ChannelBitsUseV1::broadcaster_user_id(b)),
        EventKind::ChannelCharityCampaignStart => {
            subscribe!(ChannelCharityCampaignStartV1::broadcaster_user_id(b))
        }
        EventKind::ChannelCharityCampaignStop => {
            subscribe!(ChannelCharityCampaignStopV1::broadcaster_user_id(b))
        }
        EventKind::StreamOnline => subscribe!(StreamOnlineV1::broadcaster_user_id(b)),
        EventKind::StreamOffline => subscribe!(StreamOfflineV1::broadcaster_user_id(b)),
    }
}

async fn send<E>(
    twitch: &Authed<'_>,
    condition: E,
    session_id: &str,
) -> std::result::Result<String, CreateError>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    match twitch
        .helix
        .create_eventsub_subscription(
            condition.clone(),
            Transport::websocket(session_id),
            &twitch.token,
        )
        .await
    {
        Ok(subscription) => Ok(subscription.id.to_string()),
        Err(ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
            status: http::StatusCode::CONFLICT,
            ..
        })) => existing(twitch, &condition, session_id)
            .await
            .map_err(CreateError::Transient),
        Err(ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
            status,
            message,
            ..
        })) if is_rejection(status) => Err(CreateError::Rejected(message)),
        Err(e) => Err(CreateError::Transient(e.into())),
    }
}

async fn existing<E>(twitch: &Authed<'_>, condition: &E, session_id: &str) -> Result<String>
where
    E: twitch_api::eventsub::EventSubscription,
{
    let condition = condition.condition()?;
    let mut pages = twitch.helix.get_eventsub_subscriptions(
        Status::Enabled,
        E::EVENT_TYPE,
        None,
        &twitch.token,
    );
    while let Some(page) = pages.try_next().await? {
        if let Some(found) = page
            .subscriptions
            .into_iter()
            .find(|s| is_same(s, E::VERSION, session_id, &condition))
        {
            return Ok(found.id.to_string());
        }
    }
    Err(Error::Helix(format!(
        "{} conflicted but no matching subscription exists",
        E::EVENT_TYPE
    )))
}

fn is_same(
    found: &EventSubSubscription,
    version: &str,
    session_id: &str,
    condition: &Value,
) -> bool {
    let same_session = matches!(
        &found.transport,
        TransportResponse::Websocket(t) if t.session_id == session_id
    );
    let same_condition = condition.as_object().is_some_and(|wanted| {
        wanted
            .iter()
            .all(|(key, value)| value.is_null() || found.condition.get(key) == Some(value))
    });
    found.version == version && same_session && same_condition
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
        && status != StatusCode::CONFLICT
}

#[cfg(test)]
mod tests {
    use super::{is_rejection, is_same};
    use http::StatusCode;
    use serde_json::{json, Value};
    use twitch_api::eventsub::EventSubSubscription;

    fn found(version: &str, session_id: &str, condition: Value) -> EventSubSubscription {
        serde_json::from_value(json!({
            "id": "sub1",
            "status": "enabled",
            "type": "channel.chat.message",
            "version": version,
            "cost": 0,
            "condition": condition,
            "transport": { "method": "websocket", "session_id": session_id },
            "created_at": "2026-01-01T00:00:00Z",
        }))
        .unwrap()
    }

    #[test]
    fn only_final_client_errors_reject() {
        for status in [StatusCode::BAD_REQUEST, StatusCode::FORBIDDEN] {
            assert!(is_rejection(status), "{status}");
        }
        for status in [
            StatusCode::UNAUTHORIZED,
            StatusCode::CONFLICT,
            StatusCode::TOO_MANY_REQUESTS,
            StatusCode::INTERNAL_SERVER_ERROR,
        ] {
            assert!(!is_rejection(status), "{status}");
        }
    }

    #[test]
    fn a_conflict_matches_the_same_subscription_on_this_session() {
        let wanted = json!({ "broadcaster_user_id": "1", "user_id": "2", "reward_id": null });
        let twitch = json!({ "broadcaster_user_id": "1", "user_id": "2", "reward_id": "" });
        assert!(is_same(
            &found("1", "s1", twitch.clone()),
            "1",
            "s1",
            &wanted
        ));
        assert!(!is_same(
            &found("1", "s2", twitch.clone()),
            "1",
            "s1",
            &wanted
        ));
        assert!(!is_same(&found("2", "s1", twitch), "1", "s1", &wanted));
        let other = json!({ "broadcaster_user_id": "3", "user_id": "2" });
        assert!(!is_same(&found("1", "s1", other), "1", "s1", &wanted));
    }
}
