use std::fs::OpenOptions;
use std::io::{self, BufRead, BufReader, Read, Write};
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use interprocess::TryClone;

const MAX_MESSAGE_SIZE: usize = 1_048_576;
const RECONNECT_DELAY: Duration = Duration::from_millis(1500);

fn timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn log_path() -> PathBuf {
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

fn write_to_browser(stdout_lock: &Arc<Mutex<()>>, line: &str) -> io::Result<()> {
    let bytes = line.as_bytes();
    if bytes.len() > MAX_MESSAGE_SIZE {
        return Err(io::Error::new(io::ErrorKind::InvalidData, "oversize"));
    }
    let len = (bytes.len() as u32).to_le_bytes();
    let _g = stdout_lock.lock().unwrap_or_else(|e| e.into_inner());
    let stdout = io::stdout();
    let mut out = stdout.lock();
    out.write_all(&len)?;
    out.write_all(bytes)?;
    out.flush()
}

fn spawn_reader_pump(
    reader: interprocess::local_socket::Stream,
    stdout_lock: Arc<Mutex<()>>,
    log_path: PathBuf,
) {
    std::thread::spawn(move || {
        let mut log = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .ok();
        let mut buf = BufReader::new(reader);
        let mut line = String::new();
        loop {
            line.clear();
            match buf.read_line(&mut line) {
                Ok(0) => break,
                Ok(_) => {}
                Err(e) => {
                    if let Some(l) = log.as_mut() {
                        let _ = writeln!(l, "{} reader read error: {e}", timestamp_ms());
                    }
                    break;
                }
            }
            let trimmed = line.trim_end_matches(|c| c == '\r' || c == '\n');
            if trimmed.is_empty() {
                continue;
            }
            if let Err(e) = write_to_browser(&stdout_lock, trimmed) {
                if let Some(l) = log.as_mut() {
                    let _ = writeln!(l, "{} reader stdout error: {e}", timestamp_ms());
                }
                break;
            }
            if let Some(l) = log.as_mut() {
                let _ = writeln!(l, "{} ⇇ {trimmed}", timestamp_ms());
                let _ = l.flush();
            }
        }
    });
}

fn connection_manager(
    rx: mpsc::Receiver<String>,
    stdout_lock: Arc<Mutex<()>>,
    log_path: PathBuf,
) {
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .ok();
    let mut pending: Option<String> = None;

    'outer: loop {
        let stream = loop {
            match crate::ipc::connect_to_gui() {
                Ok(s) => break s,
                Err(e) => {
                    if let Some(l) = log.as_mut() {
                        let _ = writeln!(l, "{} connect retry: {e}", timestamp_ms());
                    }
                    std::thread::sleep(RECONNECT_DELAY);
                }
            }
        };

        if let Some(l) = log.as_mut() {
            let _ = writeln!(l, "{} sink connected", timestamp_ms());
        }

        match stream.try_clone() {
            Ok(reader) => {
                spawn_reader_pump(reader, Arc::clone(&stdout_lock), log_path.clone());
            }
            Err(e) => {
                if let Some(l) = log.as_mut() {
                    let _ = writeln!(l, "{} try_clone failed: {e}", timestamp_ms());
                }
            }
        }

        if let Err(e) = write_to_browser(&stdout_lock, r#"{"type":"get_state"}"#) {
            if let Some(l) = log.as_mut() {
                let _ = writeln!(l, "{} get_state nudge failed: {e}", timestamp_ms());
            }
        }

        let mut writer = stream;

        if let Some(msg) = pending.take() {
            if writeln!(writer, "{msg}").is_err() || writer.flush().is_err() {
                pending = Some(msg);
                continue 'outer;
            }
        }

        loop {
            let msg = match rx.recv() {
                Ok(m) => m,
                Err(_) => return,
            };
            if writeln!(writer, "{msg}").is_err() || writer.flush().is_err() {
                pending = Some(msg);
                continue 'outer;
            }
        }
    }
}

pub fn run() {
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path())
        .expect("open browser-host log");
    let _ = writeln!(log, "{} host started", timestamp_ms());
    let _ = log.flush();

    let (tx, rx) = mpsc::channel::<String>();
    let stdout_lock: Arc<Mutex<()>> = Arc::new(Mutex::new(()));

    {
        let stdout_lock = Arc::clone(&stdout_lock);
        let log_path = log_path();
        std::thread::spawn(move || {
            connection_manager(rx, stdout_lock, log_path);
        });
    }

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

        if tx.send(text).is_err() {
            break;
        }
    }

    let _ = writeln!(log, "{} host exiting", timestamp_ms());
}
