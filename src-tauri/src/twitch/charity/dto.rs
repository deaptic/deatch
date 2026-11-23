use serde::Serialize;
use twitch_api::extra::DonationAmount as HelixAmount;
use twitch_api::helix::charity::CharityCampaign as HelixCampaign;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CharityCampaign {
    pub charity_name: String,
    pub current: DonationAmount,
    pub target: Option<DonationAmount>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DonationAmount {
    pub value: i32,
    pub decimal_places: i32,
    pub currency: String,
}

impl From<HelixAmount> for DonationAmount {
    fn from(a: HelixAmount) -> Self {
        Self {
            value: a.value,
            decimal_places: a.decimal_places,
            currency: a.currency,
        }
    }
}

impl From<HelixCampaign> for CharityCampaign {
    fn from(c: HelixCampaign) -> Self {
        Self {
            charity_name: c.charity_name,
            current: c.current_amount.into(),
            target: c.target_amount.map(Into::into),
        }
    }
}
