// Native messaging host mode: read length-prefixed JSON from stdin and
// forward to the running GUI via ipc::Sink. Logs each message to a file
// because stderr is captured by the browser.

use std::fs::OpenOptions;
use std::io::{self, Read, Write};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::ipc::Sink;

const MAX_MESSAGE_SIZE: usize = 1_048_576;

fn timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn log_path() -> std::path::PathBuf {
    std::env::temp_dir().join("deatch-host.log")
}

fn read_exact_or_eof<R: Read>(reader: &mut R, n: usize) -> io::Result<Option<Vec<u8>>> {
    let mut buf = vec![0u8; n];
    let mut read = 0;
    while read < n {
        let r = reader.read(&mut buf[read..])?;
        if r == 0 {
            return Ok(None);
        }
        read += r;
    }
    Ok(Some(buf))
}

pub fn run() {
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path())
        .expect("open browser-host log");
    let _ = writeln!(log, "{} host started", timestamp_ms());
    let _ = log.flush();

    let mut sink = Sink::new();
    let stdin = io::stdin();
    let mut stdin = stdin.lock();

    loop {
        let len_buf = match read_exact_or_eof(&mut stdin, 4) {
            Ok(Some(b)) => b,
            Ok(None) => break,
            Err(e) => {
                let _ = writeln!(log, "{} read length error: {e}", timestamp_ms());
                break;
            }
        };
        let len =
            u32::from_le_bytes([len_buf[0], len_buf[1], len_buf[2], len_buf[3]]) as usize;
        if len == 0 || len > MAX_MESSAGE_SIZE {
            let _ = writeln!(log, "{} bad message length: {len}", timestamp_ms());
            break;
        }
        let body = match read_exact_or_eof(&mut stdin, len) {
            Ok(Some(b)) => b,
            Ok(None) => break,
            Err(e) => {
                let _ = writeln!(log, "{} read body error: {e}", timestamp_ms());
                break;
            }
        };
        let text = String::from_utf8_lossy(&body).into_owned();
        let _ = writeln!(log, "{} <- {text}", timestamp_ms());
        let _ = log.flush();

        if let Err(e) = sink.forward(&text) {
            let _ = writeln!(log, "{} forward failed: {e}", timestamp_ms());
            let _ = log.flush();
        }
    }

    let _ = writeln!(log, "{} host exiting", timestamp_ms());
}
