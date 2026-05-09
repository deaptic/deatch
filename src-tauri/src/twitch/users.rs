use crate::{get_token, helix};

#[tauri::command]
pub async fn get_users_by_id(
    app: tauri::AppHandle,
    user_ids: Vec<String>,
) -> Result<Vec<twitch_api::helix::users::User>, String> {
    let token = get_token(&app).await?;

    let ids: Vec<twitch_api::types::UserId> =
        user_ids.iter().map(|id| id.as_str().into()).collect();

    let request = twitch_api::helix::users::GetUsersRequest::ids(&*ids);

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}

#[tauri::command]
pub async fn get_users_by_login(
    app: tauri::AppHandle,
    logins: Vec<String>,
) -> Result<Vec<twitch_api::helix::users::User>, String> {
    let token = get_token(&app).await?;

    let names: Vec<twitch_api::types::UserName> =
        logins.iter().map(|l| l.as_str().into()).collect();

    let request = twitch_api::helix::users::GetUsersRequest::logins(&*names);

    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}
