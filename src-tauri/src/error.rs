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
    #[error("{message}")]
    Helix { status: u16, message: String },
    #[error("{0}")]
    Http(String),
    #[error("{0}")]
    Auth(String),
    #[error("{0}")]
    Keyring(String),
    #[error("{0}")]
    Discord(String),
    #[error("{0}")]
    Io(String),
    #[error("{0}")]
    Invalid(String),
}

pub type Result<T> = std::result::Result<T, Error>;

impl From<ClientRequestError<reqwest::Error>> for Error {
    fn from(e: ClientRequestError<reqwest::Error>) -> Self {
        let helix = match &e {
            ClientRequestError::HelixRequestGetError(HelixRequestGetError::Error {
                status,
                message,
                ..
            })
            | ClientRequestError::HelixRequestDeleteError(HelixRequestDeleteError::Error {
                status,
                message,
                ..
            })
            | ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
                status,
                message,
                ..
            })
            | ClientRequestError::HelixRequestPutError(HelixRequestPutError::Error {
                status,
                message,
                ..
            })
            | ClientRequestError::HelixRequestPatchError(HelixRequestPatchError::Error {
                status,
                message,
                ..
            }) => Some((status.as_u16(), message.clone())),
            _ => None,
        };
        match helix {
            Some((status, message)) => Self::Helix { status, message },
            None => Self::Http(e.to_string()),
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

from_display!(Http: reqwest::Error);
from_display!(
    Auth: RefreshTokenError<reqwest::Error>,
    RetrieveTokenError<reqwest::Error>,
    DeviceUserTokenExchangeError<reqwest::Error>,
);
from_display!(Keyring: keyring_core::Error);
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
            serde_json::to_value(Error::Invalid("bad".into())).unwrap(),
            json!({ "kind": "invalid", "message": "bad" })
        );
        assert_eq!(
            serde_json::to_value(Error::Helix {
                status: 403,
                message: "nope".into(),
            })
            .unwrap(),
            json!({ "kind": "helix", "message": { "status": 403, "message": "nope" } })
        );
    }

    #[test]
    fn maps_helix_response_errors_to_status_and_message() {
        let upstream: ClientRequestError<reqwest::Error> =
            ClientRequestError::HelixRequestPostError(HelixRequestPostError::Error {
                error: "Forbidden".into(),
                status: http::StatusCode::FORBIDDEN,
                message: "user is not a moderator".into(),
                uri: http::Uri::from_static("https://api.twitch.tv/helix/moderation/bans"),
                body: Default::default(),
            });
        match Error::from(upstream) {
            Error::Helix { status, message } => {
                assert_eq!(status, 403);
                assert_eq!(message, "user is not a moderator");
            }
            other => panic!("expected Helix error, got {other:?}"),
        }
    }

    #[test]
    fn maps_other_client_errors_to_http() {
        let upstream: ClientRequestError<reqwest::Error> =
            ClientRequestError::Custom("socket closed".into());
        assert!(matches!(Error::from(upstream), Error::Http(m) if m.contains("socket closed")));
    }
}
