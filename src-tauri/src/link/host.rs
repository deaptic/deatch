use std::fmt::Display;
use std::fs::OpenOptions;
use std::io::{self, BufRead, BufReader, ErrorKind, Read, Write};
use std::sync::mpsc;
use std::time::Duration;

use interprocess::local_socket::Stream;
use interprocess::TryClone;

use super::MAX_MESSAGE_SIZE;
const RECONNECT_DELAY: Duration = Duration::from_millis(1500);
const MAX_LOG_BYTES: u64 = 1_048_576;

fn log_path() -> std::path::PathBuf {
    std::env::temp_dir().join("deatch-host.log")
}

/// The host runs without Tauri, so it keeps its own log file. Every browser
/// runs its own host on it, so it is cleared once it outgrows the cap rather
/// than on start. A failed log write has nowhere else to go and is dropped.
fn log(message: impl Display) {
    let path = log_path();
    if std::fs::metadata(&path).is_ok_and(|m| m.len() > MAX_LOG_BYTES) {
        let _ = std::fs::write(&path, "");
    }
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = writeln!(
            file,
            "{} {} {message}",
            crate::clock::unix_ms(),
            std::process::id()
        );
    }
}

enum Event {
    FromBrowser(String),
    GuiClosed(u64),
}

pub fn run() {
    log("host started");
    let (tx, rx) = mpsc::channel();
    let forward_tx = tx.clone();
    std::thread::spawn(move || forward_to_gui(rx, forward_tx));
    let mut stdin = io::stdin().lock();
    loop {
        match read_message(&mut stdin) {
            Ok(Some(text)) => {
                log(format_args!("<- {text}"));
                if tx.send(Event::FromBrowser(text)).is_err() {
                    break;
                }
            }
            Ok(None) => break,
            Err(e) => {
                log(format_args!("read error: {e}"));
                break;
            }
        }
    }
    log("host exiting");
}

fn read_message(stdin: &mut impl Read) -> io::Result<Option<String>> {
    let mut len = [0u8; 4];
    match stdin.read_exact(&mut len) {
        Err(e) if e.kind() == ErrorKind::UnexpectedEof => return Ok(None),
        result => result?,
    }
    let len = u32::from_le_bytes(len) as usize;
    if len == 0 || len > MAX_MESSAGE_SIZE {
        let error = format!("bad message length: {len}");
        return Err(io::Error::new(ErrorKind::InvalidData, error));
    }
    let mut body = vec![0; len];
    stdin.read_exact(&mut body)?;
    Ok(Some(String::from_utf8_lossy(&body).into_owned()))
}

fn write_to_browser(line: &str) -> io::Result<()> {
    if line.len() > MAX_MESSAGE_SIZE {
        return Err(io::Error::new(ErrorKind::InvalidData, "oversize"));
    }
    let mut out = io::stdout().lock();
    out.write_all(&(line.len() as u32).to_le_bytes())?;
    out.write_all(line.as_bytes())?;
    out.flush()
}

/// Each GUI connection gets an id so a stale reader's close notice, arriving
/// after we already reconnected, can't tear down the new connection.
fn forward_to_gui(rx: mpsc::Receiver<Event>, tx: mpsc::Sender<Event>) {
    for id in 0.. {
        let mut writer = connect_to_gui(id, &rx, tx.clone());
        loop {
            let message = match rx.recv() {
                Ok(Event::FromBrowser(message)) => message,
                Ok(Event::GuiClosed(closed)) if closed == id => break,
                Ok(Event::GuiClosed(_)) => continue,
                Err(_) => return,
            };
            if writeln!(writer, "{message}")
                .and_then(|()| writer.flush())
                .is_err()
            {
                break;
            }
        }
    }
}

/// Every browser message is a full state snapshot, and the browser answers
/// the `get_state` nudge sent on connect with a fresh one, so whatever queues
/// while the app is away is stale and dropped.
fn connect_to_gui(id: u64, rx: &mpsc::Receiver<Event>, tx: mpsc::Sender<Event>) -> Stream {
    let mut reported = false;
    let stream = loop {
        while rx.try_recv().is_ok() {}
        match super::ipc::connect_to_gui() {
            Ok(stream) => break stream,
            Err(e) => {
                // The app being closed is the normal case; one line is enough.
                if !reported {
                    log(format_args!("waiting for app: {e}"));
                    reported = true;
                }
                std::thread::sleep(RECONNECT_DELAY);
            }
        }
    };
    log("sink connected");
    match stream.try_clone() {
        Ok(reader) => {
            std::thread::spawn(move || {
                pump_to_browser(reader);
                log("sink closed");
                // Fails only once the forwarder has exited, which nobody awaits.
                let _ = tx.send(Event::GuiClosed(id));
            });
        }
        Err(e) => log(format_args!("try_clone failed: {e}")),
    }
    if let Err(e) = write_to_browser(r#"{"type":"get_state"}"#) {
        log(format_args!("get_state nudge failed: {e}"));
    }
    stream
}

fn pump_to_browser(reader: Stream) {
    for line in BufReader::new(reader).lines() {
        let line = match line {
            Ok(line) => line,
            Err(e) => {
                log(format_args!("reader read error: {e}"));
                return;
            }
        };
        if line.is_empty() {
            continue;
        }
        if let Err(e) = write_to_browser(&line) {
            log(format_args!("reader stdout error: {e}"));
            return;
        }
        log(format_args!("⇇ {line}"));
    }
}

#[cfg(test)]
mod tests {
    use super::{read_message, MAX_MESSAGE_SIZE};
    use std::io::Cursor;

    fn framed(len: u32, body: &[u8]) -> Cursor<Vec<u8>> {
        Cursor::new([&len.to_le_bytes()[..], body].concat())
    }

    #[test]
    fn reads_one_framed_message() {
        let message = read_message(&mut framed(5, b"hello")).unwrap();
        assert_eq!(message.as_deref(), Some("hello"));
    }

    #[test]
    fn clean_eof_ends_the_stream() {
        assert_eq!(read_message(&mut Cursor::new(vec![])).unwrap(), None);
    }

    #[test]
    fn rejects_empty_oversize_and_truncated_frames() {
        assert!(read_message(&mut framed(0, b"")).is_err());
        assert!(read_message(&mut framed(MAX_MESSAGE_SIZE as u32 + 1, b"")).is_err());
        assert!(read_message(&mut framed(5, b"hi")).is_err());
    }
}
