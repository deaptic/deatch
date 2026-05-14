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

pub(super) async fn create_subscriptions(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    broadcaster_id: &str,
    is_mod: bool,
    session_id: &str,
) -> Vec<String> {
    let user_id = token.user_id.as_str();
    let transport = Transport::websocket(session_id);
    let mut ids: Vec<String> = Vec::new();

    macro_rules! sub {
        ($kind:literal, $cond:expr) => {
            if let Some(id) =
                create(app, helix, token, broadcaster_id, $kind, $cond, transport.clone()).await
            {
                ids.push(id);
            }
        };
    }

    sub!("channel.chat.message", ChannelChatMessageV1::new(broadcaster_id, user_id));
    sub!("channel.chat.notification", ChannelChatNotificationV1::new(broadcaster_id, user_id));
    sub!("channel.chat.message_delete", ChannelChatMessageDeleteV1::new(broadcaster_id, user_id));
    sub!("channel.chat.clear", ChannelChatClearV1::new(broadcaster_id, user_id));
    sub!(
        "channel.chat.clear_user_messages",
        ChannelChatClearUserMessagesV1::new(broadcaster_id, user_id)
    );

    if is_mod {
        sub!("channel.shoutout.create", ChannelShoutoutCreateV1::new(broadcaster_id, user_id));
        sub!("channel.follow", ChannelFollowV2::new(broadcaster_id, user_id));
        sub!("channel.moderate", ChannelModerateV2::new(broadcaster_id, user_id));
    }
    ids
}

async fn create<E>(
    app: &tauri::AppHandle,
    helix: &twitch_api::HelixClient<'_, reqwest::Client>,
    token: &UserToken,
    broadcaster_id: &str,
    kind: &str,
    condition: E,
    transport: Transport,
) -> Option<String>
where
    E: twitch_api::eventsub::EventSubscription + Send + 'static,
{
    match helix
        .req_post(
            twitch_api::helix::eventsub::CreateEventSubSubscriptionRequest::<E>::new(),
            twitch_api::helix::eventsub::CreateEventSubSubscriptionBody::new(condition, transport),
            token,
        )
        .await
    {
        Ok(resp) => Some(resp.data.id.to_string()),
        Err(e) => {
            let _ = app.emit(
                "eventsub-error",
                format!("subscribe {kind} for {broadcaster_id} failed: {e:?}"),
            );
            None
        }
    }
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
