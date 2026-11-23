use crate::twitch::users::dto::UserRef;
use twitch_api::helix::users::UserBlock;

impl From<UserBlock> for UserRef {
    fn from(b: UserBlock) -> Self {
        UserRef::new(b.user_id, b.user_login, b.display_name)
    }
}
