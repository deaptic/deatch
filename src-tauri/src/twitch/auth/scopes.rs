use twitch_api::twitch_oauth2::Scope;

pub fn scopes() -> Vec<Scope> {
    vec![
        Scope::ChannelReadRedemptions,
        Scope::ModerationRead,
        Scope::UserReadModeratedChannels,
        Scope::UserReadChat,
        Scope::UserReadEmotes,
        Scope::UserReadFollows,
        Scope::UserWriteChat,
        Scope::UserBot,
        Scope::ModeratorManageChatMessages,
        Scope::ModeratorManageShoutouts,
        Scope::ModeratorManageAnnouncements,
        Scope::ModeratorManageChatSettings,
        Scope::ModeratorManageWarnings,
        Scope::ModeratorManageAutoMod,
        Scope::ModeratorReadFollowers,
        Scope::ModeratorManageBannedUsers,
        Scope::ModeratorReadBlockedTerms,
        Scope::ModeratorReadChatSettings,
        Scope::ModeratorReadUnbanRequests,
        Scope::ModeratorReadModerators,
        Scope::ModeratorReadVips,
        Scope::ModeratorReadWarnings,
        Scope::ChannelManageVips,
        Scope::ChannelManageRaids,
        Scope::ChannelManageBroadcast,
        Scope::ChannelEditCommercial,
        Scope::UserManageChatColor,
        Scope::ClipsEdit,
    ]
}
