pub mod commands;
pub mod dto;

use super::Authed;
use crate::error::{Error, Result};
use crate::twitch::ids::UserId;
use crate::twitch::pagination::collect;
use dto::User;
use futures_util::StreamExt;
use serde::Deserialize;
use twitch_api::types::{self, Collection};

#[derive(Default, Deserialize, specta::Type)]
#[serde(default, rename_all = "camelCase")]
pub struct GetUsersParams {
    pub ids: Vec<UserId>,
    pub logins: Vec<String>,
}

pub async fn get_users(twitch: &Authed<'_>, params: GetUsersParams) -> Result<Vec<User>> {
    let ids: Vec<types::UserId> = params.ids.into_iter().map(Into::into).collect();
    let logins: Vec<types::UserName> = params.logins.into_iter().map(Into::into).collect();
    let (ids, logins): (Collection<_>, Collection<_>) = (ids.into(), logins.into());
    let by_id = twitch.helix.get_users_from_ids(&ids, &twitch.token);
    let by_login = twitch.helix.get_users_from_logins(&logins, &twitch.token);
    collect(by_id.chain(by_login)).await
}

pub async fn get_self(twitch: &Authed<'_>) -> Result<User> {
    twitch
        .helix
        .get_user_from_id(&twitch.token.user_id, &twitch.token)
        .await?
        .map(User::from)
        .ok_or_else(|| Error::Invalid("authenticated user not found".into()))
}
