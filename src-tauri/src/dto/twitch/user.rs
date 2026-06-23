use super::ids::UserId;
use serde::Serialize;
use twitch_api::helix::users as helix_users;
use twitch_api::types;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BroadcasterType {
    #[serde(rename = "")]
    Normal,
    Affiliate,
    Partner,
}

impl From<types::BroadcasterType> for BroadcasterType {
    fn from(b: types::BroadcasterType) -> Self {
        match b {
            types::BroadcasterType::None => Self::Normal,
            types::BroadcasterType::Affiliate => Self::Affiliate,
            types::BroadcasterType::Partner => Self::Partner,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserRef {
    pub id: UserId,
    pub login: String,
    pub display_name: String,
}

impl UserRef {
    pub fn new(id: impl ToString, login: impl ToString, display_name: impl ToString) -> Self {
        Self {
            id: UserId(id.to_string()),
            login: login.to_string(),
            display_name: display_name.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: UserId,
    pub login: String,
    pub display_name: String,
    pub description: String,
    pub profile_image_url: String,
    pub broadcaster_type: BroadcasterType,
    pub created_at: String,
}

impl From<helix_users::User> for User {
    fn from(u: helix_users::User) -> Self {
        Self {
            id: UserId(u.id.to_string()),
            login: u.login.to_string(),
            display_name: u.display_name.to_string(),
            description: u.description.unwrap_or_default(),
            profile_image_url: u.profile_image_url.unwrap_or_default(),
            broadcaster_type: u
                .broadcaster_type
                .map(Into::into)
                .unwrap_or(BroadcasterType::Normal),
            created_at: u.created_at.to_string(),
        }
    }
}
