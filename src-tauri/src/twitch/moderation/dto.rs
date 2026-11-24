use crate::twitch::client::ids::UnbanRequestId;
use crate::twitch::users::dto::UserRef;
use serde::{Deserialize, Serialize};
use twitch_api::helix::moderation::{
    update_automod_settings::UpdateAutoModSettingsIndividual,
    AutoModSettings as HelixAutoModSettings, BannedUser as HelixBannedUser,
    BlockedTerm as HelixBlockedTerm, ModeratedChannel as HelixModeratedChannel,
    UnbanRequest as HelixUnbanRequest,
};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BannedUser {
    pub user: UserRef,
    pub moderator: UserRef,
    pub reason: Option<String>,
    pub expires_at: Option<String>,
}

impl From<HelixBannedUser> for BannedUser {
    fn from(b: HelixBannedUser) -> Self {
        Self {
            user: UserRef::new(b.user_id, b.user_login, b.user_name),
            moderator: UserRef::new(b.moderator_id, b.moderator_login, b.moderator_name),
            reason: b.reason.filter(|r| !r.is_empty()),
            expires_at: b.expires_at.map(|t| t.to_string()),
        }
    }
}

impl From<HelixModeratedChannel> for UserRef {
    fn from(m: HelixModeratedChannel) -> Self {
        UserRef::new(m.broadcaster_id, m.broadcaster_login, m.broadcaster_name)
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct UnbanRequest {
    pub id: UnbanRequestId,
    pub user: UserRef,
    pub text: String,
    pub created_at: String,
}

impl From<HelixUnbanRequest> for UnbanRequest {
    fn from(r: HelixUnbanRequest) -> Self {
        Self {
            id: r.id.take().into(),
            user: UserRef::new(r.user_id, r.user_login, r.user_name),
            text: r.text,
            created_at: r.created_at.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BlockedTerm {
    pub id: String,
    pub text: String,
}

impl From<HelixBlockedTerm> for BlockedTerm {
    fn from(t: HelixBlockedTerm) -> Self {
        Self {
            id: t.id.take(),
            text: t.text,
        }
    }
}

#[derive(Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct BannedPage {
    pub banned: Vec<BannedUser>,
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AutoModLevels {
    pub disability: u8,
    pub aggression: u8,
    pub sexuality_sex_or_gender: u8,
    pub misogyny: u8,
    pub bullying: u8,
    pub swearing: u8,
    pub race_ethnicity_or_religion: u8,
    pub sex_based_terms: u8,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct AutoModSettings {
    pub overall_level: Option<u8>,
    pub levels: AutoModLevels,
}

impl From<HelixAutoModSettings> for AutoModSettings {
    fn from(s: HelixAutoModSettings) -> Self {
        Self {
            overall_level: s.overall_level,
            levels: AutoModLevels {
                disability: s.disability,
                aggression: s.aggression,
                sexuality_sex_or_gender: s.sexuality_sex_or_gender,
                misogyny: s.misogyny,
                bullying: s.bullying,
                swearing: s.swearing,
                race_ethnicity_or_religion: s.race_ethnicity_or_religion,
                sex_based_terms: s.sex_based_terms,
            },
        }
    }
}

impl From<AutoModLevels> for UpdateAutoModSettingsIndividual {
    fn from(l: AutoModLevels) -> Self {
        let mut body = Self::default();
        body.disability = Some(l.disability);
        body.aggression = Some(l.aggression);
        body.sexuality_sex_or_gender = Some(l.sexuality_sex_or_gender);
        body.misogyny = Some(l.misogyny);
        body.bullying = Some(l.bullying);
        body.swearing = Some(l.swearing);
        body.race_ethnicity_or_religion = Some(l.race_ethnicity_or_religion);
        body.sex_based_terms = Some(l.sex_based_terms);
        body
    }
}
