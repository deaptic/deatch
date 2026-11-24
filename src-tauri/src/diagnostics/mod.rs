pub mod commands;
pub mod dto;

use crate::platform::lock::lock;
use crate::twitch::Twitch;
use dto::{AppStats, ProcessStats};
use std::collections::{HashMap, HashSet};
use std::sync::{mpsc, Mutex};
use std::time::Duration;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System};

const BROWSER_PID_TIMEOUT: Duration = Duration::from_secs(1);

pub struct Monitor(Mutex<Option<System>>);

impl Default for Monitor {
    fn default() -> Self {
        let system = System::new()
            .inspect_err(|e| log::warn!("process stats unavailable: {e}"))
            .ok();
        Self(Mutex::new(system))
    }
}

pub fn stats(monitor: &Monitor, twitch: &Twitch, browser: Option<u32>) -> AppStats {
    let (app, webview) = monitor.sample(browser);
    AppStats {
        app,
        webview,
        eventsub: twitch.eventsub_stats(),
    }
}

impl Monitor {
    fn sample(&self, browser: Option<u32>) -> (ProcessStats, ProcessStats) {
        let mut guard = lock(&self.0);
        let samples: Vec<Sample> = guard.as_mut().map_or_else(Vec::new, |system| {
            let refresh = ProcessRefreshKind::nothing().with_memory().with_cpu();
            system.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh);
            system
                .processes()
                .values()
                .map(|p| Sample {
                    pid: p.pid().as_u32(),
                    parent: p.parent().map(|parent| parent.as_u32()),
                    private_bytes: p.virtual_memory(),
                    cpu: p.cpu_usage(),
                })
                .collect()
        });
        let cores = std::thread::available_parallelism().map_or(1, |n| n.get());
        split(std::process::id(), browser, &samples, cores as f32)
    }
}

struct Sample {
    pid: u32,
    parent: Option<u32>,
    private_bytes: u64,
    cpu: f32,
}

pub fn browser_process_id(webview: &tauri::WebviewWindow) -> Option<u32> {
    let (tx, rx) = mpsc::channel();
    let posted = webview.with_webview(move |platform| {
        let _ = tx.send(read_browser_process_id(&platform));
    });
    if let Err(e) = posted {
        log::warn!("webview browser process unreadable: {e}");
        return None;
    }
    match rx.recv_timeout(BROWSER_PID_TIMEOUT) {
        Ok(Ok(pid)) => Some(pid),
        Ok(Err(e)) => {
            log::warn!("webview browser process unreadable: {e}");
            None
        }
        Err(e) => {
            log::warn!("webview browser process not reported: {e}");
            None
        }
    }
}

fn read_browser_process_id(
    platform: &tauri::webview::PlatformWebview,
) -> windows_core::Result<u32> {
    let mut pid = 0;
    unsafe {
        platform
            .controller()
            .CoreWebView2()?
            .BrowserProcessId(&mut pid)?
    };
    Ok(pid)
}

fn split(
    own: u32,
    browser: Option<u32>,
    samples: &[Sample],
    cores: f32,
) -> (ProcessStats, ProcessStats) {
    let mut children: HashMap<u32, Vec<&Sample>> = HashMap::new();
    for sample in samples {
        if let Some(parent) = sample.parent {
            children.entry(parent).or_default().push(sample);
        }
    }
    let mut webview = ProcessStats::default();
    let root = browser.unwrap_or(own);
    if let Some(sample) = browser.and_then(|pid| samples.iter().find(|s| s.pid == pid)) {
        add(&mut webview, sample, cores);
    }
    let mut stack = vec![root];
    let mut seen = HashSet::from([own, root]);
    while let Some(pid) = stack.pop() {
        for child in children.get(&pid).into_iter().flatten() {
            if !seen.insert(child.pid) {
                continue;
            }
            add(&mut webview, child, cores);
            stack.push(child.pid);
        }
    }
    let mut app = ProcessStats::default();
    if let Some(own) = samples.iter().find(|s| s.pid == own) {
        add(&mut app, own, cores);
    }
    (app, webview)
}

fn add(stats: &mut ProcessStats, sample: &Sample, cores: f32) {
    stats.private_bytes += sample.private_bytes;
    stats.cpu_percent += sample.cpu / cores;
    stats.processes += 1;
}

#[cfg(test)]
mod tests {
    use super::{split, Sample};

    fn sample(pid: u32, parent: Option<u32>, private_bytes: u64, cpu: f32) -> Sample {
        Sample {
            pid,
            parent,
            private_bytes,
            cpu,
        }
    }

    #[test]
    fn counts_every_descendant_as_webview() {
        let samples = [
            sample(1, None, 999, 50.0),
            sample(10, Some(1), 100, 20.0),
            sample(20, Some(10), 200, 40.0),
            sample(21, Some(10), 300, 0.0),
            sample(30, Some(2), 5000, 90.0),
        ];
        let (app, webview) = split(1, None, &samples, 4.0);
        assert_eq!((app.private_bytes, app.processes), (999, 1));
        assert_eq!(app.cpu_percent, 12.5);
        assert_eq!((webview.private_bytes, webview.processes), (600, 3));
        assert_eq!(webview.cpu_percent, 15.0);
    }

    #[test]
    fn survives_a_parent_cycle_from_pid_reuse() {
        let samples = [
            sample(1, None, 1, 0.0),
            sample(10, Some(1), 100, 0.0),
            sample(20, Some(10), 200, 0.0),
            sample(10, Some(20), 100, 0.0),
        ];
        let (_, webview) = split(1, None, &samples, 1.0);
        assert_eq!((webview.private_bytes, webview.processes), (300, 2));
    }

    #[test]
    fn counts_a_shared_browser_process_that_is_not_our_child() {
        let samples = [
            sample(1, None, 50, 0.0),
            sample(7, Some(99), 400, 8.0),
            sample(70, Some(7), 100, 4.0),
            sample(71, Some(7), 100, 0.0),
            sample(30, Some(2), 5000, 90.0),
        ];
        let (app, webview) = split(1, Some(7), &samples, 4.0);
        assert_eq!((app.private_bytes, app.processes), (50, 1));
        assert_eq!((webview.private_bytes, webview.processes), (600, 3));
        assert_eq!(webview.cpu_percent, 3.0);
    }
}
