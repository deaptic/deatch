use super::dto::{BttvChannelResponse, BttvEmote, EmoteEntry};
use crate::error::Result;
use crate::http::get_json;
use crate::twitch::ids::UserId;

pub async fn get_global_emotes(http: &reqwest::Client) -> Result<Vec<EmoteEntry>> {
    let emotes: Vec<BttvEmote> =
        get_json(http, "https://api.betterttv.net/3/cached/emotes/global").await?;
    Ok(emotes.into_iter().map(EmoteEntry::from).collect())
}

pub async fn get_channel_emotes(
    http: &reqwest::Client,
    channel_id: UserId,
) -> Result<Vec<EmoteEntry>> {
    let response: BttvChannelResponse = get_json(
        http,
        &format!("https://api.betterttv.net/3/cached/users/twitch/{channel_id}"),
    )
    .await?;
    Ok(response
        .channel_emotes
        .into_iter()
        .chain(response.shared_emotes)
        .map(EmoteEntry::from)
        .collect())
}
