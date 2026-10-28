use std::time::Duration;

use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::{Error, Result};
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

/// Read timeouts only start once a socket is open, so a stalled handshake
/// needs its own bound to reach the caller's reconnect loop.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

pub type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

pub async fn connect(url: &str) -> Result<Socket> {
    let (socket, _) = tokio::time::timeout(CONNECT_TIMEOUT, connect_async(url))
        .await
        .map_err(|elapsed| Error::Io(elapsed.into()))??;
    Ok(socket)
}
