use crate::{get_token, helix};
use serde::Deserialize;
use twitch_api::types;

// https://dev.twitch.tv/docs/api/reference/#get-users
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUsersParams {
    pub user_ids: Vec<String>,
    pub logins: Vec<String>,
}

#[tauri::command]
pub async fn get_users(
    app: tauri::AppHandle,
    params: GetUsersParams,
) -> Result<Vec<twitch_api::helix::users::User>, String> {
    let user_ids: Vec<types::UserId> = params
        .user_ids
        .into_iter()
        .map(types::UserId::from)
        .collect();
    let logins: Vec<types::UserName> = params
        .logins
        .into_iter()
        .map(types::UserName::from)
        .collect();

    let mut request = twitch_api::helix::users::GetUsersRequest::new();
    request.id = (&*user_ids).into();
    request.login = (&*logins).into();

    let token = get_token(&app).await?;
    helix()
        .req_get(request, &token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data)
}
