use serde::{Deserialize, Serialize};
use std::fmt;

macro_rules! id_type {
    ($name:ident) => {
        #[derive(
            Debug,
            Clone,
            PartialEq,
            Eq,
            PartialOrd,
            Ord,
            Hash,
            Serialize,
            Deserialize,
            specta::Type,
        )]
        #[serde(transparent)]
        pub struct $name(String);

        impl $name {
            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                self.as_str().fmt(f)
            }
        }

        impl From<String> for $name {
            fn from(s: String) -> Self {
                Self(s)
            }
        }

        impl From<&str> for $name {
            fn from(s: &str) -> Self {
                Self(s.to_string())
            }
        }
    };
}

id_type!(UserId);
id_type!(StreamId);
id_type!(GameId);
id_type!(MessageId);
id_type!(EmoteId);
id_type!(EmoteSetId);
id_type!(RewardId);
id_type!(CommunityGiftId);
id_type!(SevenTvEmoteSetId);

impl From<UserId> for twitch_api::types::UserId {
    fn from(id: UserId) -> Self {
        id.0.into()
    }
}

impl From<GameId> for twitch_api::types::CategoryId {
    fn from(id: GameId) -> Self {
        id.0.into()
    }
}

impl From<&twitch_api::twitch_oauth2::UserToken> for UserId {
    fn from(token: &twitch_api::twitch_oauth2::UserToken) -> Self {
        token.user_id.as_str().into()
    }
}
