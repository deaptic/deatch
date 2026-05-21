pub mod bttv;
pub mod ffz;
pub mod robotty;
pub mod seventv;
pub mod seventv_events;

#[derive(serde::Serialize, Clone)]
pub struct EmoteEntry {
    pub name: String,
    pub url: String,
}
