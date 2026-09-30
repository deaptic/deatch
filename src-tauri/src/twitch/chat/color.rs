use serde::Deserialize;
use twitch_api::extra::AnnouncementColor as HelixAnnouncementColor;
use twitch_api::types::NamedUserColor;

#[derive(Clone, Copy, Default, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum AnnouncementColor {
    #[default]
    Primary,
    Blue,
    Green,
    Orange,
    Purple,
}

impl From<AnnouncementColor> for HelixAnnouncementColor {
    fn from(color: AnnouncementColor) -> Self {
        match color {
            AnnouncementColor::Primary => Self::Primary,
            AnnouncementColor::Blue => Self::Blue,
            AnnouncementColor::Green => Self::Green,
            AnnouncementColor::Orange => Self::Orange,
            AnnouncementColor::Purple => Self::Purple,
        }
    }
}

#[derive(Clone, Copy, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum ChatColor {
    Blue,
    BlueViolet,
    CadetBlue,
    Chocolate,
    Coral,
    DodgerBlue,
    Firebrick,
    GoldenRod,
    Green,
    HotPink,
    OrangeRed,
    Red,
    SeaGreen,
    SpringGreen,
    YellowGreen,
}

impl From<ChatColor> for NamedUserColor<'static> {
    fn from(color: ChatColor) -> Self {
        match color {
            ChatColor::Blue => Self::Blue,
            ChatColor::BlueViolet => Self::BlueViolet,
            ChatColor::CadetBlue => Self::CadetBlue,
            ChatColor::Chocolate => Self::Chocolate,
            ChatColor::Coral => Self::Coral,
            ChatColor::DodgerBlue => Self::DodgerBlue,
            ChatColor::Firebrick => Self::Firebrick,
            ChatColor::GoldenRod => Self::GoldenRod,
            ChatColor::Green => Self::Green,
            ChatColor::HotPink => Self::HotPink,
            ChatColor::OrangeRed => Self::OrangeRed,
            ChatColor::Red => Self::Red,
            ChatColor::SeaGreen => Self::SeaGreen,
            ChatColor::SpringGreen => Self::SpringGreen,
            ChatColor::YellowGreen => Self::YellowGreen,
        }
    }
}
