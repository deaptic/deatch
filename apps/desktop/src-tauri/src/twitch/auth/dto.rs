use serde::Serialize;

#[derive(Serialize, Clone, specta::Type)]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
}
