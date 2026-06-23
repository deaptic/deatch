use super::credentials::save_credentials;
use super::session::get_access_token;
use crate::services::twitch::TwitchState;
use tauri::{Emitter, Manager};
use twitch_api::twitch_oauth2::TwitchToken;

pub async fn refresh_token_now(app: &tauri::AppHandle) -> Result<(), String> {
    let mut token = get_access_token(app).ok_or_else(|| "Not authenticated".to_string())?;
    // Without an explicit timeout reqwest will wait indefinitely on a stalled
    // connection, which has bricked the refresh loop in the past.
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    token
        .refresh_token(&http_client)
        .await
        .map_err(|e| e.to_string())?;
    save_credentials(&token);
    *app.state::<TwitchState>().token.lock().unwrap() = Some(token);
    Ok(())
}

pub fn spawn_token_refresh(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            // Sleep duration shrinks as the token approaches expiry so a
            // failed refresh retries quickly while there's still time left.
            let sleep_for = {
                let state = app.state::<TwitchState>();
                let guard = state.token.lock().unwrap();
                match guard.as_ref() {
                    None => std::time::Duration::from_secs(60),
                    Some(t) => {
                        let remaining = t.expires_in();
                        if remaining < std::time::Duration::from_secs(120) {
                            std::time::Duration::from_secs(10)
                        } else {
                            std::time::Duration::from_secs(60)
                        }
                    }
                }
            };
            tokio::time::sleep(sleep_for).await;

            let needs_refresh = {
                let state = app.state::<TwitchState>();
                let guard = state.token.lock().unwrap();
                match guard.as_ref() {
                    None => false,
                    Some(t) => t.expires_in() < std::time::Duration::from_secs(600),
                }
            };
            if needs_refresh {
                if let Err(e) = refresh_token_now(&app).await {
                    let _ = app.emit("twitch-auth-error", format!("refresh failed: {e}"));
                }
            }
        }
    });
}
