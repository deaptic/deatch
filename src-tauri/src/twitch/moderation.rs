use super::{get_token, helix};
use serde::Deserialize;
use std::borrow::Cow;
use twitch_api::helix::channels::{AddChannelVipRequest, RemoveChannelVipRequest};
use twitch_api::helix::moderation::{
    delete_chat_messages::DeleteChatMessagesRequest,
    manage_held_automod_messages::{
        ManageHeldAutoModMessagesBody, ManageHeldAutoModMessagesRequest,
    },
    warn_chat_user::{WarnChatUserBody, WarnChatUserRequest},
    BanUser, BanUserBody, BanUserRequest, BannedUser, GetBannedUsersRequest,
    GetModeratedChannelsRequest, GetModeratorsRequest, ModeratedChannel, Moderator,
    UnbanUserRequest,
};
use twitch_api::helix::raids::{CancelARaidRequest, StartARaidRequest};
use twitch_api::helix::{Cursor, EmptyBody};
use twitch_api::types::MsgId;

use super::response::PaginatedResponse;

// https://dev.twitch.tv/docs/api/reference/#delete-chat-messages
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteChatMessagesParams {
    pub broadcaster_id: String,
    pub message_id: Option<String>,
}

#[tauri::command]
pub async fn delete_chat_messages(
    app: tauri::AppHandle,
    params: DeleteChatMessagesParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;

    let mut request = DeleteChatMessagesRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    request.message_id = params.message_id.map(|s| Cow::Owned(MsgId::from(s)));

    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
// https://dev.twitch.tv/docs/api/reference/#ban-user
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    #[serde(default)]
    pub duration: Option<u32>,
    #[serde(default)]
    pub reason: Option<String>,
}

#[tauri::command]
pub async fn ban_user(app: tauri::AppHandle, params: BanUserParams) -> Result<BanUser, String> {
    let token = get_token(&app).await?;
    let request = BanUserRequest::new(params.broadcaster_id.as_str(), token.user_id.as_str());
    let body = BanUserBody::new(
        params.user_id.as_str(),
        params.reason.unwrap_or_default(),
        params.duration,
    );
    helix()
        .req_post(request, body, &token)
        .await
        .map(|r| r.data)
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#get-banned-users
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetBannedUsersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_banned_users(
    app: tauri::AppHandle,
    params: GetBannedUsersParams,
) -> Result<PaginatedResponse<BannedUser>, String> {
    let token = get_token(&app).await?;
    let mut request = GetBannedUsersRequest::broadcaster_id(params.broadcaster_id.as_str());
    if let Some(uid) = params.user_id.as_deref() {
        request.user_id = vec![twitch_api::types::UserId::from(uid)].into();
    }
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;
    Ok(PaginatedResponse::new(response.data, response.pagination))
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetAllBannedUsersParams {
    pub broadcaster_id: String,
    pub user_id: Option<String>,
}

#[tauri::command]
pub async fn get_all_banned_users(
    app: tauri::AppHandle,
    params: GetAllBannedUsersParams,
) -> Result<Vec<BannedUser>, String> {
    let token = get_token(&app).await?;
    let bc = params.broadcaster_id;
    let uid = params.user_id;
    super::utils::fetch_all_pages(&token, |after| {
        let mut request =
            GetBannedUsersRequest::broadcaster_id(twitch_api::types::UserId::from(bc.as_str()));
        if let Some(u) = uid.as_deref() {
            request.user_id = vec![twitch_api::types::UserId::from(u)].into();
        }
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

// https://dev.twitch.tv/docs/api/reference/#unban-user
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnbanUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn unban_user(app: tauri::AppHandle, params: UnbanUserParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request = UnbanUserRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
        params.user_id.as_str(),
    );
    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#get-moderators
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratorsParams {
    pub broadcaster_id: String,
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderators(
    app: tauri::AppHandle,
    params: GetModeratorsParams,
) -> Result<PaginatedResponse<Moderator>, String> {
    let token = get_token(&app).await?;

    let mut request = GetModeratorsRequest::broadcaster_id(params.broadcaster_id.as_str());
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetAllModeratorsParams {
    pub broadcaster_id: String,
}

#[tauri::command]
pub async fn get_all_moderators(
    app: tauri::AppHandle,
    params: GetAllModeratorsParams,
) -> Result<Vec<Moderator>, String> {
    let token = get_token(&app).await?;
    let bc = params.broadcaster_id;
    super::utils::fetch_all_pages(&token, |after| {
        let mut request =
            GetModeratorsRequest::broadcaster_id(twitch_api::types::UserId::from(bc.as_str()));
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await
}

// https://dev.twitch.tv/docs/api/reference/#add-channel-vip
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn add_channel_vip(
    app: tauri::AppHandle,
    params: AddChannelVipParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request =
        AddChannelVipRequest::new(params.broadcaster_id.as_str(), params.user_id.as_str());
    helix()
        .req_post(request, twitch_api::helix::EmptyBody, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#remove-channel-vip
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoveChannelVipParams {
    pub broadcaster_id: String,
    pub user_id: String,
}

#[tauri::command]
pub async fn remove_channel_vip(
    app: tauri::AppHandle,
    params: RemoveChannelVipParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request =
        RemoveChannelVipRequest::new(params.broadcaster_id.as_str(), params.user_id.as_str());
    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#get-moderated-channels
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetModeratedChannelsParams {
    pub first: Option<usize>,
    pub after: Option<String>,
}

#[tauri::command]
pub async fn get_moderated_channels(
    app: tauri::AppHandle,
    params: GetModeratedChannelsParams,
) -> Result<PaginatedResponse<ModeratedChannel>, String> {
    let token = get_token(&app).await?;

    let mut request = GetModeratedChannelsRequest::user_id(token.user_id.clone());
    request.first = params.first;
    request.after = params.after.map(|s| Cow::Owned(Cursor::from(s)));

    let response = helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PaginatedResponse::new(response.data, response.pagination))
}

/// Fetches every page of moderated channels for the authenticated user and,
/// as a side effect, refreshes the `moderated_channel_ids` cache used by the
/// eventsub task to decide `is_mod` for new subscriptions.
#[tauri::command]
pub async fn get_all_moderated_channels(
    app: tauri::AppHandle,
) -> Result<Vec<ModeratedChannel>, String> {
    let token = get_token(&app).await?;
    let channels = super::utils::fetch_all_pages(&token, |after| {
        let mut request = GetModeratedChannelsRequest::user_id(token.user_id.clone());
        request.after = after.map(|s| Cow::Owned(Cursor::from(s)));
        request
    })
    .await?;
    super::utils::cache_moderated_channel_ids(&app, &channels);
    Ok(channels)
}

// https://dev.twitch.tv/docs/api/reference/#start-a-raid
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRaidParams {
    pub from_broadcaster_id: String,
    pub to_broadcaster_id: String,
}

#[tauri::command]
pub async fn start_raid(
    app: tauri::AppHandle,
    params: StartRaidParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request = StartARaidRequest::new(
        params.from_broadcaster_id.as_str(),
        params.to_broadcaster_id.as_str(),
    );
    helix()
        .req_post(request, EmptyBody, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#cancel-a-raid
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelRaidParams {
    pub broadcaster_id: String,
}

#[tauri::command]
pub async fn cancel_raid(
    app: tauri::AppHandle,
    params: CancelRaidParams,
) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request = CancelARaidRequest::broadcaster_id(params.broadcaster_id.as_str());
    helix()
        .req_delete(request, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#warn-chat-user
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WarnUserParams {
    pub broadcaster_id: String,
    pub user_id: String,
    pub reason: String,
}

#[tauri::command]
pub async fn warn_user(app: tauri::AppHandle, params: WarnUserParams) -> Result<(), String> {
    let token = get_token(&app).await?;
    let request = WarnChatUserRequest::new(
        params.broadcaster_id.as_str(),
        token.user_id.as_str(),
    );
    let body = WarnChatUserBody::new(params.user_id.as_str(), params.reason.as_str());
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// https://dev.twitch.tv/docs/api/reference/#manage-held-automod-messages
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManageHeldAutomodMessageParams {
    pub msg_id: String,
}

#[tauri::command]
pub async fn approve_held_automod_message(
    app: tauri::AppHandle,
    params: ManageHeldAutomodMessageParams,
) -> Result<(), String> {
    manage_held_automod_message(&app, params.msg_id.as_str(), true).await
}

#[tauri::command]
pub async fn deny_held_automod_message(
    app: tauri::AppHandle,
    params: ManageHeldAutomodMessageParams,
) -> Result<(), String> {
    manage_held_automod_message(&app, params.msg_id.as_str(), false).await
}

async fn manage_held_automod_message(
    app: &tauri::AppHandle,
    msg_id: &str,
    allow: bool,
) -> Result<(), String> {
    let token = get_token(app).await?;
    let request = ManageHeldAutoModMessagesRequest::new();
    let body = ManageHeldAutoModMessagesBody::new(token.user_id.as_str(), msg_id, allow);
    helix()
        .req_post(request, body, &token)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}
