use super::dto::{ChannelResult, EmoteEntry, StvChannelResponse, StvGlobalResponse};
use crate::error::Result;
use crate::http::{get_json, url};
use crate::twitch::ids::UserId;

pub async fn get_global_emotes(http: &reqwest::Client) -> Result<Vec<EmoteEntry>> {
    let response: StvGlobalResponse = get_json(http, "https://7tv.io/v3/emote-sets/global").await?;
    Ok(response.emotes.into_iter().map(EmoteEntry::from).collect())
}

pub async fn get_channel_emotes(
    http: &reqwest::Client,
    broadcaster_id: UserId,
) -> Result<ChannelResult> {
    let response: StvChannelResponse = get_json(
        http,
        url("https://7tv.io/v3/users/twitch", &[broadcaster_id.as_str()])?,
    )
    .await?;
    Ok(response.into())
}
