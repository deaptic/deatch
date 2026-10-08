use std::fmt::Display;
use std::fs::OpenOptions;
use std::io::{self, BufRead, BufReader, ErrorKind, Read, Write};
use std::sync::mpsc;
use std::time::Duration;

use interprocess::local_socket::Stream;
use interprocess::TryClone;

const MAX_MESSAGE_SIZE: usize = 1_048_576;
const RECONNECT_DELAY: Duration = Duration::from_millis(1500);

fn log_path() -> std::path::PathBuf {
    std::env::temp_dir().join("deatch-host.log")
}

/// The host runs without Tauri, so it keeps its own log file. A failed log
/// write has nowhere else to go and is dropped.
fn log(message: impl Display) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path())
    {
        let _ = writeln!(file, "{} {message}", crate::clock::unix_ms());
    }
}

pub fn run() {
    // One browser session per file; without this the log grows forever.
    let _ = std::fs::write(log_path(), "");
    log("host started");
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || forward_to_gui(rx));
    let mut stdin = io::stdin().lock();
    loop {
        match read_message(&mut stdin) {
            Ok(Some(text)) => {
                log(format_args!("<- {text}"));
                if tx.send(text).is_err() {
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

fn forward_to_gui(rx: mpsc::Receiver<String>) {
    let mut pending: Option<String> = None;
    loop {
        let mut writer = connect_to_gui();
        loop {
            let message = match pending.take() {
                Some(message) => message,
                None => match rx.recv() {
                    Ok(message) => message,
                    Err(_) => return,
                },
            };
            if writeln!(writer, "{message}")
                .and_then(|()| writer.flush())
                .is_err()
            {
                pending = Some(message);
                break;
            }
        }
    }
}

fn connect_to_gui() -> Stream {
    let mut reported = false;
    let stream = loop {
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
            std::thread::spawn(move || pump_to_browser(reader));
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
