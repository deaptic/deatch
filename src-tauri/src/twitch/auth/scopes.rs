use twitch_api::twitch_oauth2::Scope;

type Feature = (&'static str, &'static [Scope]);

const FEATURES: &[Feature] = &[
    (
        "chat",
        &[
            Scope::UserReadChat,
            Scope::UserWriteChat,
            Scope::UserManageChatColor,
            Scope::UserReadFollows,
            Scope::UserReadModeratedChannels,
        ],
    ),
    ("emotes", &[Scope::UserReadEmotes]),
    (
        "blocked users",
        &[Scope::UserReadBlockedUsers, Scope::UserManageBlockedUsers],
    ),
    ("clips", &[Scope::ClipsEdit]),
    ("whispers", &[Scope::UserManageWhispers]),
    (
        "moderation",
        &[
            Scope::ModeratorManageChatMessages,
            Scope::ModeratorManageChatSettings,
            Scope::ModeratorManageBannedUsers,
            Scope::ModeratorManageWarnings,
            Scope::ModeratorManageAutoMod,
            Scope::ModeratorManageShieldMode,
            Scope::ModeratorManageShoutouts,
            Scope::ModeratorManageAnnouncements,
            Scope::ModeratorReadFollowers,
            Scope::ModeratorReadChatters,
        ],
    ),
    ("blocked terms", &[Scope::ModeratorManageBlockedTerms]),
    (
        "automod settings",
        &[
            Scope::ModeratorReadAutomodSettings,
            Scope::ModeratorManageAutomodSettings,
        ],
    ),
    ("unban requests", &[Scope::ModeratorManageUnbanRequests]),
    (
        "suspicious users",
        &[
            Scope::ModeratorReadSuspiciousUsers,
            Scope::ModeratorManageSuspiciousUsers,
        ],
    ),
    (
        "roles",
        &[
            Scope::ModeratorReadModerators,
            Scope::ModeratorReadVips,
            Scope::ChannelManageModerators,
            Scope::ChannelManageVips,
        ],
    ),
    (
        "stream",
        &[
            Scope::ChannelManageBroadcast,
            Scope::ChannelManageRaids,
            Scope::ChannelReadSubscriptions,
        ],
    ),
    (
        "polls and predictions",
        &[
            Scope::ChannelReadPolls,
            Scope::ChannelManagePolls,
            Scope::ChannelReadPredictions,
            Scope::ChannelManagePredictions,
        ],
    ),
    (
        "ads",
        &[
            Scope::ChannelReadAds,
            Scope::ChannelManageAds,
            Scope::ChannelEditCommercial,
        ],
    ),
    (
        "channel activity",
        &[
            Scope::ChannelReadRedemptions,
            Scope::ChannelReadHypeTrain,
            Scope::ChannelReadGoals,
            Scope::ChannelReadCharity,
            Scope::BitsRead,
        ],
    ),
];

pub fn all() -> Vec<Scope> {
    let mut scopes: Vec<Scope> = Vec::new();
    for scope in FEATURES.iter().flat_map(|(_, scopes)| scopes.iter()) {
        if !scopes.contains(scope) {
            scopes.push(scope.clone());
        }
    }
    scopes
}

pub fn missing(granted: &[Scope]) -> Vec<(&'static str, Scope)> {
    FEATURES
        .iter()
        .flat_map(|(feature, scopes)| scopes.iter().map(move |s| (*feature, s)))
        .filter(|(_, scope)| !granted.contains(scope))
        .map(|(feature, scope)| (feature, scope.clone()))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::{all, missing};
    use twitch_api::twitch_oauth2::Scope;

    #[test]
    fn asks_for_each_scope_once() {
        let scopes = all();
        let unique: std::collections::HashSet<String> =
            scopes.iter().map(ToString::to_string).collect();
        assert_eq!(unique.len(), scopes.len());
        assert!(scopes.contains(&Scope::ChannelManageAds));
    }

    #[test]
    fn names_the_feature_behind_each_missing_scope() {
        let granted: Vec<Scope> = all()
            .into_iter()
            .filter(|s| *s != Scope::ModeratorManageBlockedTerms)
            .collect();
        let gaps = missing(&granted);
        assert_eq!(gaps.len(), 1);
        assert_eq!(gaps[0].0, "blocked terms");
    }
}
