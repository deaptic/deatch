pub mod commands;
pub mod dto;

use crate::twitch::Twitch;
use dto::{AppStats, ProcessStats};
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System};

/// CPU usage is measured between two refreshes, so one `System` lives for
/// the app's lifetime and every sample compares against the previous one.
pub struct Monitor(Mutex<System>);

impl Default for Monitor {
    fn default() -> Self {
        Self(Mutex::new(System::new()))
    }
}

pub fn stats(monitor: &Monitor, twitch: &Twitch) -> AppStats {
    let (app, webview) = monitor.sample();
    AppStats {
        app,
        webview,
        eventsub: twitch.eventsub_stats(),
    }
}

impl Monitor {
    fn sample(&self) -> (ProcessStats, ProcessStats) {
        let Ok(own) = sysinfo::get_current_pid() else {
            return Default::default();
        };
        let mut system = self.0.lock().unwrap();
        let refresh = ProcessRefreshKind::nothing().with_memory().with_cpu();
        system.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh);
        let samples: Vec<Sample> = system
            .processes()
            .values()
            .map(|p| Sample {
                pid: p.pid().as_u32(),
                parent: p.parent().map(|parent| parent.as_u32()),
                memory_bytes: p.memory(),
                cpu: p.cpu_usage(),
            })
            .collect();
        let cores = std::thread::available_parallelism().map_or(1, |n| n.get());
        split(own.as_u32(), &samples, cores as f32)
    }
}

struct Sample {
    pid: u32,
    parent: Option<u32>,
    memory_bytes: u64,
    cpu: f32,
}

/// WebView2 runs its browser and renderer processes as descendants of the
/// app, so everything below our own process counts as the WebView.
fn split(own: u32, samples: &[Sample], cores: f32) -> (ProcessStats, ProcessStats) {
    let mut children: HashMap<u32, Vec<&Sample>> = HashMap::new();
    for sample in samples {
        if let Some(parent) = sample.parent {
            children.entry(parent).or_default().push(sample);
        }
    }
    let mut webview = ProcessStats::default();
    let mut stack = vec![own];
    while let Some(pid) = stack.pop() {
        for child in children.get(&pid).into_iter().flatten() {
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
    stats.memory_bytes += sample.memory_bytes;
    stats.cpu_percent += sample.cpu / cores;
    stats.processes += 1;
}

#[cfg(test)]
mod tests {
    use super::{split, Sample};

    fn sample(pid: u32, parent: Option<u32>, memory_bytes: u64, cpu: f32) -> Sample {
        Sample {
            pid,
            parent,
            memory_bytes,
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
        let (app, webview) = split(1, &samples, 4.0);
        assert_eq!((app.memory_bytes, app.processes), (999, 1));
        assert_eq!(app.cpu_percent, 12.5);
        assert_eq!((webview.memory_bytes, webview.processes), (600, 3));
        assert_eq!(webview.cpu_percent, 15.0);
    }
}
