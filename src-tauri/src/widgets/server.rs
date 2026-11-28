use std::net::{Ipv4Addr, SocketAddr, TcpListener};
use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, RawQuery, State};
use axum::http::{header, StatusCode, Uri};
use axum::response::{IntoResponse, Redirect, Response};
use axum::routing::get;
use axum::Router;
use tauri::{AssetResolver, Wry};
use tokio::sync::broadcast::error::RecvError;

use super::{Frame, Subscription, Widgets};
use crate::platform::identity::WIDGET_PORT;

const PAGE: &str = "widget.html";

#[derive(Clone)]
struct Server {
    widgets: Widgets,
    assets: Arc<AssetResolver<Wry>>,
    page_origin: String,
    address: SocketAddr,
}

pub fn start(assets: AssetResolver<Wry>, page_origin: Option<url::Url>) -> Widgets {
    let listener = match bind() {
        Ok(listener) => listener,
        Err(e) => {
            log::error!("widget server could not listen on port {WIDGET_PORT}: {e}");
            return Widgets::new(Err(e.to_string()));
        }
    };
    let address = SocketAddr::from((Ipv4Addr::LOCALHOST, WIDGET_PORT));
    let widgets = Widgets::new(Ok(address));
    let server = Server {
        widgets: widgets.clone(),
        assets: Arc::new(assets),
        page_origin: page_origin
            .map(|url| url.origin().ascii_serialization())
            .unwrap_or_default(),
        address,
    };
    tauri::async_runtime::spawn(serve(listener, server));
    widgets
}

fn bind() -> std::io::Result<TcpListener> {
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, WIDGET_PORT))?;
    listener.set_nonblocking(true)?;
    Ok(listener)
}

async fn serve(listener: TcpListener, server: Server) {
    let router = Router::new()
        .route("/w/{id}", get(page))
        .route("/ws/{id}", get(socket))
        .fallback(asset)
        .with_state(server);
    let result = match tokio::net::TcpListener::from_std(listener) {
        Ok(listener) => axum::serve(listener, router).await,
        Err(e) => Err(e),
    };
    if let Err(e) = result {
        log::error!("widget server stopped: {e}");
    }
}

fn is_widget_id(id: &str) -> bool {
    !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
}

fn page_url(origin: &str, id: &str, address: SocketAddr, extra: Option<&str>) -> String {
    let url = format!("{origin}/{PAGE}?id={id}&server={address}");
    match extra {
        Some(query) => format!("{url}&{query}"),
        None => url,
    }
}

async fn page(
    State(server): State<Server>,
    Path(id): Path<String>,
    RawQuery(query): RawQuery,
) -> Response {
    if !is_widget_id(&id) {
        return StatusCode::NOT_FOUND.into_response();
    }
    let url = page_url(&server.page_origin, &id, server.address, query.as_deref());
    Redirect::temporary(&url).into_response()
}

async fn socket(
    State(server): State<Server>,
    Path(id): Path<String>,
    upgrade: WebSocketUpgrade,
) -> Response {
    match server.widgets.subscribe(&id) {
        Some(subscription) => upgrade.on_upgrade(|ws| stream(ws, subscription)),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn send(ws: &mut WebSocket, frame: Frame) -> Result<(), axum::Error> {
    ws.send(Message::Text(frame.to_string().into())).await
}

async fn stream(mut ws: WebSocket, subscription: Subscription) {
    let Subscription { replay, mut frames } = subscription;
    for frame in replay {
        if send(&mut ws, frame).await.is_err() {
            return;
        }
    }
    loop {
        tokio::select! {
            frame = frames.recv() => match frame {
                Ok(frame) => {
                    if send(&mut ws, frame).await.is_err() {
                        return;
                    }
                }
                Err(RecvError::Lagged(_) | RecvError::Closed) => return,
            },
            incoming = ws.recv() => {
                if !matches!(incoming, Some(Ok(_))) {
                    return;
                }
            }
        }
    }
}

async fn asset(State(server): State<Server>, uri: Uri) -> Response {
    match server.assets.get(uri.path().to_owned()) {
        Some(asset) => ([(header::CONTENT_TYPE, asset.mime_type)], asset.bytes).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn widget_ids_are_url_safe() {
        assert!(is_widget_id("0b6c7f0e-2d1a-4c4e-9a63-1f2e3d4c5b6a"));
        assert!(!is_widget_id(""));
        assert!(!is_widget_id("a&server=evil"));
        assert!(!is_widget_id("../index"));
    }

    #[test]
    fn page_url_points_the_page_at_this_server() {
        let address = SocketAddr::from((Ipv4Addr::LOCALHOST, WIDGET_PORT));
        assert_eq!(
            page_url("http://localhost:1420", "abc", address, None),
            format!("http://localhost:1420/widget.html?id=abc&server=127.0.0.1:{WIDGET_PORT}")
        );
        assert_eq!(
            page_url("", "abc", address, None),
            format!("/widget.html?id=abc&server=127.0.0.1:{WIDGET_PORT}")
        );
        assert_eq!(
            page_url("", "abc", address, Some("preview&lang=fi")),
            format!("/widget.html?id=abc&server=127.0.0.1:{WIDGET_PORT}&preview&lang=fi")
        );
    }
}
