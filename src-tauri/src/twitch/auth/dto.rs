use serde::Serialize;

#[derive(Serialize, Clone, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DcfAuthResponse {
    pub user_code: String,
    pub verification_uri: String,
}
