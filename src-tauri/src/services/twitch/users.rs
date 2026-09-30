use super::Authed;
use crate::dto::twitch::user::User;
use crate::error::{Error, Result};
use twitch_api::helix::users::GetUsersRequest;
use twitch_api::types::{UserId, UserName};

pub async fn get_users(
    twitch: &Authed<'_>,
    ids: Vec<String>,
    logins: Vec<String>,
) -> Result<Vec<User>> {
    let ids: Vec<UserId> = ids.into_iter().map(UserId::from).collect();
    let logins: Vec<UserName> = logins.into_iter().map(UserName::from).collect();

    let mut request = GetUsersRequest::new();
    request.id = (&*ids).into();
    request.login = (&*logins).into();

    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(User::from).collect())
}

pub async fn get_self(twitch: &Authed<'_>) -> Result<User> {
    twitch
        .helix
        .get_user_from_id(&twitch.token.user_id, &twitch.token)
        .await?
        .map(User::from)
        .ok_or_else(|| Error::Invalid("authenticated user not found".into()))
}
