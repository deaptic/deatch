use crate::{auth::refresh_token_now, get_token, helix};

#[tauri::command]
pub async fn get_streams_by_user_id(
    app: tauri::AppHandle,
    user_ids: Vec<String>,
) -> Result<Vec<twitch_api::helix::streams::Stream>, String> {
    let ids: Vec<twitch_api::types::UserId> =
        user_ids.iter().map(|id| id.as_str().into()).collect();

    let token = get_token(&app)?;
    let request = twitch_api::helix::streams::GetStreamsRequest::user_ids(&*ids);
    let result = helix().req_get(request.clone(), &token).await;

    if let Err(ref e) = result {
        if e.to_string().contains("401") && refresh_token_now(&app).await {
            let token = get_token(&app)?;
            return helix()
                .req_get(request, &token)
                .await
                .map_err(|e| e.to_string())
                .map(|r| r.data);
        }
    }

    result.map_err(|e| e.to_string()).map(|r| r.data)
}

#[tauri::command]
pub async fn get_followed_streams(
    app: tauri::AppHandle,
) -> Result<Vec<twitch_api::helix::streams::Stream>, String> {
    let token = get_token(&app)?;
    let request = twitch_api::helix::streams::GetFollowedStreamsRequest::user_id(&token.user_id);
    let result = helix().req_get(request, &token).await;

    if let Err(ref e) = result {
        if e.to_string().contains("401") && refresh_token_now(&app).await {
            let token = get_token(&app)?;
            let request = twitch_api::helix::streams::GetFollowedStreamsRequest::user_id(&token.user_id);
            return helix()
                .req_get(request, &token)
                .await
                .map_err(|e| e.to_string())
                .map(|r| r.data);
        }
    }

    result.map_err(|e| e.to_string()).map(|r| r.data)
}
