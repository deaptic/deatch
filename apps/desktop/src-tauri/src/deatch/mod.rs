pub mod commands;
pub mod events;
pub mod hub;
mod presence;

const BASE_URL: &str = match option_env!("DEATCH_API_URL") {
    Some(url) => url,
    None => "http://localhost:8000",
};
