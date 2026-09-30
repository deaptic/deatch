pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use dto::User;
use serde::Deserialize;
use twitch_api::helix::users::GetUsersRequest;
use twitch_api::types;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUsersParams {
    pub ids: Vec<UserId>,
    pub logins: Vec<String>,
}

pub async fn get_users(twitch: &Authed<'_>, params: GetUsersParams) -> Result<Vec<User>> {
    let ids: Vec<types::UserId> = params.ids.into_iter().map(|id| id.0.into()).collect();
    let logins: Vec<types::UserName> = params.logins.into_iter().map(Into::into).collect();

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
