use crate::{get_token, helix};

#[tauri::command]
pub async fn get_global_emotes(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::chat::GlobalEmote>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetGlobalEmotesRequest::new();

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

#[tauri::command]
pub async fn get_user_emotes(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::chat::UserEmote>, String> {
    let token = get_token(&app).await?;
    let client = helix();
    let request = twitch_api::helix::chat::GetUserEmotesRequest::user_id(token.user_id.as_str());

    let mut response = client
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;
    let mut all = std::mem::take(&mut response.data);

    while let Some(next) = response
        .get_next(&client, &token)
        .await
        .map_err(|e| e.to_string())?
    {
        response = next;
        all.extend(std::mem::take(&mut response.data));
    }

    Ok(all)
}

#[tauri::command]
pub async fn get_global_chat_badges(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::chat::BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetGlobalChatBadgesRequest::new();

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

#[tauri::command]
pub async fn get_channel_chat_badges(
    app: tauri::AppHandle,
    broadcaster_id: String,
) -> Result<Vec<twitch_api::helix::chat::BadgeSet>, String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::GetChannelChatBadgesRequest::broadcaster_id(
        broadcaster_id.as_str(),
    );

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

#[tauri::command]
pub async fn get_channel_emotes(
    app: tauri::AppHandle,
    broadcaster_id: String,
) -> Result<Vec<twitch_api::helix::chat::ChannelEmote>, String> {
    let token = get_token(&app).await?;

    let request =
        twitch_api::helix::chat::GetChannelEmotesRequest::broadcaster_id(broadcaster_id.as_str());

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}


#[tauri::command]
pub async fn send_shoutout(
    app: tauri::AppHandle,
    from_broadcaster_id: String,
    to_broadcaster_id: String,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::send_a_shoutout::SendAShoutoutRequest::new(
        from_broadcaster_id.as_str(),
        to_broadcaster_id.as_str(),
        token.user_id.as_str(),
    );

    let body = twitch_api::helix::EmptyBody;

    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn send_chat_message(
    app: tauri::AppHandle,
    broadcaster_id: String,
    message: String,
    reply_parent_message_id: Option<String>,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let request = twitch_api::helix::chat::send_chat_message::SendChatMessageRequest::new();

    let mut body = twitch_api::helix::chat::send_chat_message::SendChatMessageBody::new(
        broadcaster_id.as_str(),
        token.user_id.as_str(),
        message.as_str(),
    );

    body.reply_parent_message_id =
        reply_parent_message_id.map(|s| std::borrow::Cow::Owned(twitch_api::types::MsgId::from(s)));

    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
