use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct EventEnvelope<T> {
    pub timestamp: String,
    pub event: T,
}

impl<T> EventEnvelope<T> {
    pub fn new(timestamp: impl Into<String>, event: T) -> Self {
        Self {
            timestamp: timestamp.into(),
            event,
        }
    }
}
