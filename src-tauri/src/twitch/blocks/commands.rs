use crate::error::Result;
use crate::twitch::blocks::{self, BlockParams};
use crate::twitch::users::dto::UserRef;
use crate::twitch::Twitch;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_blocked_users(twitch: State<'_, Twitch>) -> Result<Vec<UserRef>> {
    blocks::get_blocked_users(&twitch.authed().await?).await
}

#[tauri::command]
#[specta::specta]
pub async fn block_user(twitch: State<'_, Twitch>, params: BlockParams) -> Result<()> {
    blocks::block_user(&twitch.authed().await?, params).await
}

#[tauri::command]
#[specta::specta]
pub async fn unblock_user(twitch: State<'_, Twitch>, params: BlockParams) -> Result<()> {
    blocks::unblock_user(&twitch.authed().await?, params).await
}
