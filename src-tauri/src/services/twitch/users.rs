use crate::dto::twitch::user::User;
use super::helix;
use twitch_api::helix::users::GetUsersRequest;
use twitch_api::twitch_oauth2::UserToken;
use twitch_api::types::{UserId, UserName};

pub async fn get_users(
    token: &UserToken,
    ids: Vec<String>,
    logins: Vec<String>,
) -> Result<Vec<User>, String> {
    let ids: Vec<UserId> = ids.into_iter().map(UserId::from).collect();
    let logins: Vec<UserName> = logins.into_iter().map(UserName::from).collect();

    let mut request = GetUsersRequest::new();
    request.id = (&*ids).into();
    request.login = (&*logins).into();

    helix()
        .req_get(request, token)
        .await
        .map_err(|e| e.to_string())
        .map(|r| r.data.into_iter().map(User::from).collect())
}
