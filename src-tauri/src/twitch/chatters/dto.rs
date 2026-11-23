use crate::twitch::users::dto::UserRef;
use serde::Serialize;
use twitch_api::helix::channels::Vip;
use twitch_api::helix::chat::Chatter;
use twitch_api::helix::moderation::Moderator;

#[derive(Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ChattersPage {
    pub chatters: Vec<UserRef>,
    pub total: u32,
    pub cursor: Option<String>,
}

impl From<Chatter> for UserRef {
    fn from(c: Chatter) -> Self {
        UserRef::new(c.user_id, c.user_login, c.user_name)
    }
}

impl From<Moderator> for UserRef {
    fn from(m: Moderator) -> Self {
        UserRef::new(m.user_id, m.user_login, m.user_name)
    }
}

impl From<Vip> for UserRef {
    fn from(v: Vip) -> Self {
        UserRef::new(v.user_id, v.user_login, v.user_name)
    }
}
