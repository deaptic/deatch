use super::ids::UserId;
use serde::Deserialize;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BroadcasterParams {
    pub broadcaster_id: UserId,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BroadcasterUserParams {
    pub broadcaster_id: UserId,
    pub user_id: UserId,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BroadcasterPairParams {
    pub from_broadcaster_id: UserId,
    pub to_broadcaster_id: UserId,
}
