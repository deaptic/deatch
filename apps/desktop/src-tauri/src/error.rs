use twitch_api::client::CompatError;
use twitch_api::helix::{
    ClientRequestError, HelixRequestDeleteError, HelixRequestGetError, HelixRequestPatchError,
    HelixRequestPostError, HelixRequestPutError,
};
use twitch_api::twitch_oauth2::tokens::errors::{
    DeviceUserTokenExchangeError, RefreshTokenError, RetrieveTokenError,
};

#[derive(Debug, Clone, thiserror::Error, serde::Serialize, specta::Type)]
#[serde(tag = "kind", content = "message", rename_all = "camelCase")]
pub enum Error {
    #[error("not authenticated")]
    NotAuthenticated,
    #[error("{0}")]
    Helix(String),
    #[error("{0}")]
    Http(String),
    #[error("{0}")]
    Auth(String),
    #[error("{0}")]
    Discord(String),
    #[error("{0}")]
    Io(String),
    #[error("{0}")]
    Invalid(String),
}

pub type Result<T> = std::result::Result<T, Error>;

/// Helix rejections carry Twitch's own explanation, which is what the user
/// should see; anything else is a transport failure.
impl From<ClientRequestError<reqwest::Error>> for Error {
    fn from(e: ClientRequestError<reqwest::Error>) -> Self {
        match &e {
            ClientRequestError::HelixRequestGetError(HelixRequestGetError::Error {
                message,
                ..
            })
            | ClientRequestError::HelixRequestDeleteError(HelixRequestDeleteError::Error {
                message,
                ..
            })
            | ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
                message,
                ..
            })
            | ClientRequestError::HelixRequestPutError(HelixRequestPutError::Error {
                message,
                ..
            })
            | ClientRequestError::HelixRequestPatchError(HelixRequestPatchError::Error {
                message,
                ..
            }) => Self::Helix(message.clone()),
            _ => Self::Http(e.to_string()),
        }
    }
}

macro_rules! from_display {
    ($variant:ident: $($source:ty),+ $(,)?) => {
        $(
            impl From<$source> for Error {
                fn from(e: $source) -> Self {
                    Self::$variant(e.to_string())
                }
            }
        )+
    };
}

type OAuthError = CompatError<reqwest::Error>;

from_display!(Http: reqwest::Error);
from_display!(
    Auth: RefreshTokenError<OAuthError>,
    RetrieveTokenError<OAuthError>,
    DeviceUserTokenExchangeError<OAuthError>,
    keyring_core::Error,
);
from_display!(Discord: discord_rich_presence::error::Error);
from_display!(Io: std::io::Error, tauri::Error);
from_display!(Invalid: serde_json::Error);

#[cfg(test)]
mod tests {
    use super::Error;
    use serde_json::json;
    use twitch_api::helix::{ClientRequestError, HelixRequestPostError};

    #[test]
    fn serializes_as_kind_and_message() {
        assert_eq!(
            serde_json::to_value(Error::NotAuthenticated).unwrap(),
            json!({ "kind": "notAuthenticated" })
        );
        assert_eq!(
            serde_json::to_value(Error::Helix("nope".into())).unwrap(),
            json!({ "kind": "helix", "message": "nope" })
        );
    }

    #[test]
    fn maps_helix_response_errors_to_their_message() {
        let upstream: ClientRequestError<reqwest::Error> =
            ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
                error: "Forbidden".into(),
                status: http::StatusCode::FORBIDDEN,
                message: "user is not a moderator".into(),
                uri: http::Uri::from_static("https://api.twitch.tv/helix/moderation/bans"),
                body: Default::default(),
            });
        assert!(matches!(Error::from(upstream), Error::Helix(m) if m == "user is not a moderator"));
    }

    #[test]
    fn maps_other_client_errors_to_http() {
        let upstream: ClientRequestError<reqwest::Error> =
            ClientRequestError::Custom("socket closed".into());
        assert!(matches!(Error::from(upstream), Error::Http(m) if m.contains("socket closed")));
    }
}
