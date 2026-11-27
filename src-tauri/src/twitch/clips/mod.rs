pub mod commands;
pub mod dto;

use super::Authed;
use crate::platform::error::Result;
use crate::twitch::client::ids::UserId;
use dto::{Clip, CreatedClip};
use futures_util::future::join_all;
use serde::Deserialize;
use twitch_api::helix::clips::create_clip::CreateClipRequest;
use twitch_api::helix::clips::get_clips::GetClipsRequest;
use twitch_api::helix::EmptyBody;
use twitch_api::types::TimestampRef;

const CLIPS_PER_CHANNEL: usize = 2;
const TOP_CLIPS: usize = 40;

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct TopClipsParams {
    pub broadcaster_ids: Vec<UserId>,
    pub started_at: String,
}

fn most_viewed(mut clips: Vec<Clip>) -> Vec<Clip> {
    clips.sort_by_key(|clip| std::cmp::Reverse(clip.views));
    let mut per_channel = std::collections::HashMap::<String, usize>::new();
    clips.retain(|clip| {
        let shown = per_channel.entry(clip.broadcaster_id.clone()).or_default();
        *shown += 1;
        *shown <= CLIPS_PER_CHANNEL
    });
    clips.truncate(TOP_CLIPS);
    clips
}

async fn channel_clips(
    twitch: &Authed<'_>,
    broadcaster_id: &UserId,
    started_at: &TimestampRef,
) -> Result<Vec<Clip>> {
    let request = GetClipsRequest::broadcaster_id(broadcaster_id.as_str())
        .started_at(started_at)
        .first(CLIPS_PER_CHANNEL);
    let response = twitch.helix.req_get(request, &twitch.token).await?;
    Ok(response.data.into_iter().map(Clip::from).collect())
}

pub async fn top_clips(twitch: &Authed<'_>, params: TopClipsParams) -> Result<Vec<Clip>> {
    let started_at = TimestampRef::from_str(&params.started_at)?;
    let results = join_all(
        params
            .broadcaster_ids
            .iter()
            .map(|id| channel_clips(twitch, id, started_at)),
    )
    .await;
    let mut clips = Vec::new();
    for (id, result) in params.broadcaster_ids.iter().zip(results) {
        match result {
            Ok(found) => clips.extend(found),
            Err(e) => log::warn!("clips not loaded broadcaster={id}: {e}"),
        }
    }
    Ok(most_viewed(clips))
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateClipParams {
    pub broadcaster_id: UserId,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub duration: Option<f32>,
}

pub async fn create_clip(twitch: &Authed<'_>, params: CreateClipParams) -> Result<CreatedClip> {
    let mut request = CreateClipRequest::broadcaster_id(params.broadcaster_id.as_str());
    if let Some(title) = params.title.as_deref() {
        request = request.title(title);
    }
    if let Some(duration) = params.duration {
        request = request.duration(duration);
    }
    let response = twitch
        .helix
        .req_post(request, EmptyBody, &twitch.token)
        .await?;
    Ok(CreatedClip::from(response.data))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn clip(id: &str, views: u32) -> Clip {
        Clip {
            id: id.into(),
            broadcaster_id: id.into(),
            title: String::new(),
            url: String::new(),
            thumbnail_url: String::new(),
            views,
            created_at: String::new(),
        }
    }

    #[test]
    fn top_clips_are_the_most_viewed_across_channels() {
        let clips: Vec<Clip> = (0..60).map(|i| clip(&i.to_string(), i)).collect();
        let top = most_viewed(clips);
        assert_eq!(top.len(), TOP_CLIPS);
        assert_eq!(top[0].views, 59);
        assert!(top.windows(2).all(|pair| pair[0].views >= pair[1].views));
    }

    #[test]
    fn no_channel_takes_more_than_its_share_of_the_top_clips() {
        let mut clips: Vec<Clip> = (0..5)
            .map(|i| Clip {
                broadcaster_id: "big".into(),
                ..clip(&format!("big{i}"), 100 + i)
            })
            .collect();
        clips.push(clip("small", 1));
        let top = most_viewed(clips);
        let big = top.iter().filter(|c| c.broadcaster_id == "big").count();
        assert_eq!(big, CLIPS_PER_CHANNEL);
        assert!(top.iter().any(|c| c.broadcaster_id == "small"));
    }
}
