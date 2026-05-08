pub mod bttv;
pub mod ffz;
pub mod seventv;

#[derive(serde::Serialize, Clone)]
pub struct EmoteEntry {
    pub name: String,
    pub url: String,
}
