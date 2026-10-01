use serde::Serialize;
use twitch_api::helix::bits::get_cheermotes::{
    Cheermote as HelixCheermote, CheermoteImage as HelixCheermoteImage, Tiers,
};

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Cheermote {
    pub prefix: String,
    pub tiers: Vec<CheermoteTier>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CheermoteTier {
    pub min_bits: u64,
    pub color: String,
    pub dark: CheermoteImage,
    pub light: CheermoteImage,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CheermoteImage {
    pub animated: String,
    pub still: String,
}

impl From<HelixCheermoteImage> for CheermoteImage {
    fn from(i: HelixCheermoteImage) -> Self {
        Self {
            animated: i.animated.url_2x,
            still: i.static_.url_2x,
        }
    }
}

impl From<HelixCheermote> for Cheermote {
    fn from(c: HelixCheermote) -> Self {
        let mut tiers: Vec<CheermoteTier> = c.tiers.into_iter().map(CheermoteTier::from).collect();
        tiers.sort_by_key(|t| t.min_bits);
        Self {
            prefix: c.prefix,
            tiers,
        }
    }
}

impl From<Tiers> for CheermoteTier {
    fn from(t: Tiers) -> Self {
        Self {
            min_bits: u64::try_from(t.min_bits).unwrap_or(0),
            color: t.color,
            dark: CheermoteImage::from(t.images.dark),
            light: CheermoteImage::from(t.images.light),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Cheermote, HelixCheermote};
    use serde_json::json;

    fn images(theme: &str) -> serde_json::Value {
        let set = |kind: &str| {
            let url = |scale: &str| format!("https://cdn/{theme}/{kind}/{scale}");
            json!({
                "1": url("1"), "1.5": url("1.5"), "2": url("2"), "3": url("3"), "4": url("4")
            })
        };
        json!({ "animated": set("animated"), "static": set("static") })
    }

    fn tier(min_bits: u64, color: &str) -> serde_json::Value {
        json!({
            "min_bits": min_bits,
            "id": min_bits.to_string(),
            "color": color,
            "images": { "dark": images("dark"), "light": images("light") },
            "can_cheer": true,
            "show_in_bits_card": true
        })
    }

    fn dark() -> serde_json::Value {
        json!({ "animated": "https://cdn/dark/animated/2", "still": "https://cdn/dark/static/2" })
    }

    fn light() -> serde_json::Value {
        json!({ "animated": "https://cdn/light/animated/2", "still": "https://cdn/light/static/2" })
    }

    #[test]
    fn maps_tiers_in_ascending_order_with_both_image_kinds() {
        let helix: HelixCheermote = serde_json::from_value(json!({
            "prefix": "Cheer",
            "tiers": [tier(100, "#9c3ee8"), tier(1, "#979797")],
            "type": "global_first_party",
            "order": 1,
            "last_updated": "2018-05-22T00:06:04Z",
            "is_charitable": false
        }))
        .unwrap();
        assert_eq!(
            serde_json::to_value(Cheermote::from(helix)).unwrap(),
            json!({
                "prefix": "Cheer",
                "tiers": [
                    { "minBits": 1, "color": "#979797", "dark": dark(), "light": light() },
                    { "minBits": 100, "color": "#9c3ee8", "dark": dark(), "light": light() }
                ]
            })
        );
    }
}
