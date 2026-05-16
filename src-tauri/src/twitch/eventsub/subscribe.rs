use tauri::Emitter;
use twitch_api::eventsub::{
    channel::chat::{
        ChannelChatClearUserMessagesV1, ChannelChatClearV1, ChannelChatMessageDeleteV1,
        ChannelChatMessageV1, ChannelChatNotificationV1,
    },
    channel::{ChannelFollowV2, ChannelModerateV2, ChannelShoutoutCreateV1},
    Transport,
};
use twitch_api::twitch_oauth2::UserToken;

use super::EventKind;

pub(super) async fn create_subscription(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    broadcaster_id: &str,
    kind: EventKind,
    session_id: &str,
) -> Option<String> {
    let user_id = token.user_id.as_str();
    let transport = Transport::websocket(session_id);

    let result = match kind {
        EventKind::ChannelChatMessage => {
            create(helix, token, ChannelChatMessageV1::new(broadcaster_id, user_id), transport).await
        }
        EventKind::ChannelChatNotification => {
            create(
                helix,
                token,
                ChannelChatNotificationV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatMessageDelete => {
            create(
                helix,
                token,
                ChannelChatMessageDeleteV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelChatClear => {
            create(helix, token, ChannelChatClearV1::new(broadcaster_id, user_id), transport).await
        }
        EventKind::ChannelChatClearUserMessages => {
            create(
                helix,
                token,
                ChannelChatClearUserMessagesV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelShoutoutCreate => {
            create(
                helix,
                token,
                ChannelShoutoutCreateV1::new(broadcaster_id, user_id),
                transport,
            )
            .await
        }
        EventKind::ChannelFollow => {
            create(helix, token, ChannelFollowV2::new(broadcaster_id, user_id), transport).await
        }
        EventKind::ChannelModerate => {
            create(helix, token, ChannelModerateV2::new(broadcaster_id, user_id), transport).await
        }
    };

    match result {
        Ok(id) => {
            println!("[eventsub] subscribed kind={kind:?} broadcaster={broadcaster_id}");
            let _ = app.emit(
                "eventsub-subscribed",
                serde_json::json!({ "broadcaster_id": broadcaster_id, "kind": kind }),
            );
            Some(id)
        }
        Err(e) => {
            emit_failed(app, broadcaster_id, kind, format!("{e:?}"));
            None
        }
    }
}

pub(super) fn emit_failed(
    app: &tauri::AppHandle,
    broadcaster_id: &str,
    kind: EventKind,
    error: impl Into<String>,
) {
    let error = error.into();
    println!("[eventsub] subscribe-failed kind={kind:?} broadcaster={broadcaster_id} error={error}");
    let _ = app.emit(
        "eventsub-subscribe-failed",
        serde_json::json!({
            "broadcaster_id": broadcaster_id,
            "kind": kind,
            "error": error,
        }),
    );
}

async fn create<E>(
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    condition: E,
    transport: Transport,
) -> Result<String, twitch_api::helix::ClientRequestError<reqwest::Error>>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    let resp = helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<E>::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(condition, transport),
            token,
        )
        .await?;
    Ok(resp.data.id.to_string())
}

pub(super) async fn delete_subscription(
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    subscription_id: &str,
) -> Result<(), String> {
    helix
        .req_delete(
            twitch_api::helix::eventsub::DeleteEventSubSubscriptionRequest::id(subscription_id),
            token,
        )
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
