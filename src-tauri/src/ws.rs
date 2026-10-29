use std::sync::Arc;
use std::time::Duration;

use rustls::ClientConfig;
use rustls_platform_verifier::BuilderVerifierExt;
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::error::TlsError;
use tokio_tungstenite::tungstenite::{Error, Result};
use tokio_tungstenite::{
    connect_async_tls_with_config, Connector, MaybeTlsStream, WebSocketStream,
};

/// Read timeouts only start once a socket is open, so a stalled handshake
/// needs its own bound to reach the caller's reconnect loop.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

pub type Socket = WebSocketStream<MaybeTlsStream<TcpStream>>;

pub async fn connect(url: &str) -> Result<Socket> {
    let handshake = connect_async_tls_with_config(url, None, false, Some(tls()?));
    let (socket, _) = tokio::time::timeout(CONNECT_TIMEOUT, handshake)
        .await
        .map_err(|elapsed| Error::Io(elapsed.into()))??;
    Ok(socket)
}

fn tls() -> std::result::Result<Connector, TlsError> {
    let provider = Arc::new(rustls::crypto::aws_lc_rs::default_provider());
    let config = ClientConfig::builder_with_provider(provider)
        .with_safe_default_protocol_versions()?
        .with_platform_verifier()?
        .with_no_client_auth();
    Ok(Connector::Rustls(Arc::new(config)))
}

#[cfg(test)]
mod tests {
    use super::tls;

    #[test]
    fn tls_builds_with_its_own_provider_although_rustls_has_two() {
        assert!(tls().is_ok());
    }
}
