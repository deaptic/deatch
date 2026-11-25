pub mod commands;
mod server;

use std::collections::{BTreeMap, HashMap};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use serde::Deserialize;
use tokio::sync::broadcast;

use crate::platform::error::{Error, Result};
use crate::platform::lock::lock;

pub use server::start;

const FRAME_BACKLOG: usize = 64;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum Topic {
    Style,
    Assets,
    Entries,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct PublishParams {
    pub widget: String,
    pub topic: Topic,
    pub frame: String,
}

#[derive(Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RetainParams {
    pub widgets: Vec<String>,
}

pub type Frame = Arc<str>;

struct Feed {
    latest: BTreeMap<Topic, Frame>,
    frames: broadcast::Sender<Frame>,
}

impl Feed {
    fn new() -> Self {
        Self {
            latest: BTreeMap::new(),
            frames: broadcast::channel(FRAME_BACKLOG).0,
        }
    }
}

pub struct Subscription {
    pub replay: Vec<Frame>,
    pub frames: broadcast::Receiver<Frame>,
}

#[derive(Clone)]
pub struct Widgets {
    feeds: Arc<Mutex<HashMap<String, Feed>>>,
    address: std::result::Result<SocketAddr, String>,
}

impl Widgets {
    pub fn new(address: std::result::Result<SocketAddr, String>) -> Self {
        Self {
            feeds: Arc::default(),
            address,
        }
    }

    pub fn address(&self) -> Result<String> {
        self.address
            .clone()
            .map(|addr| format!("http://{addr}"))
            .map_err(Error::Io)
    }

    pub fn publish(&self, params: PublishParams) {
        let frame: Frame = params.frame.into();
        let mut feeds = lock(&self.feeds);
        let feed = feeds.entry(params.widget).or_insert_with(Feed::new);
        feed.latest.insert(params.topic, frame.clone());
        let _no_viewers = feed.frames.send(frame);
    }

    pub fn retain(&self, params: RetainParams) {
        lock(&self.feeds).retain(|id, _| params.widgets.contains(id));
    }

    fn subscribe(&self, widget: &str) -> Option<Subscription> {
        let feeds = lock(&self.feeds);
        let feed = feeds.get(widget)?;
        Some(Subscription {
            replay: feed.latest.values().cloned().collect(),
            frames: feed.frames.subscribe(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn publish(widgets: &Widgets, widget: &str, topic: Topic, frame: &str) {
        widgets.publish(PublishParams {
            widget: widget.into(),
            topic,
            frame: frame.into(),
        });
    }

    #[test]
    fn replays_the_latest_frame_of_each_topic() {
        let widgets = Widgets::new(Err("unbound".into()));
        publish(&widgets, "a", Topic::Entries, "old");
        publish(&widgets, "a", Topic::Style, "style");
        publish(&widgets, "a", Topic::Entries, "new");
        let replay = widgets.subscribe("a").unwrap().replay;
        assert_eq!(
            replay.iter().map(|f| &**f).collect::<Vec<_>>(),
            ["style", "new"]
        );
    }

    #[test]
    fn unknown_and_dropped_widgets_have_no_subscription() {
        let widgets = Widgets::new(Err("unbound".into()));
        publish(&widgets, "a", Topic::Style, "style");
        publish(&widgets, "b", Topic::Style, "style");
        widgets.retain(RetainParams {
            widgets: vec!["b".into()],
        });
        assert!(widgets.subscribe("a").is_none());
        assert!(widgets.subscribe("b").is_some());
        assert!(widgets.subscribe("c").is_none());
    }
}
