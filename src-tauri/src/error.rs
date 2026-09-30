use twitch_api::helix::{
    ClientRequestError, HelixRequestDeleteError, HelixRequestGetError, HelixRequestPatchError,
    HelixRequestPostError, HelixRequestPutError,
};
use twitch_api::twitch_oauth2::tokens::errors::{
    DeviceUserTokenExchangeError, RefreshTokenError, RetrieveTokenError,
};

#[derive(Debug, thiserror::Error, serde::Serialize)]
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
