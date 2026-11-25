use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use reqwest::redirect::{Attempt, Policy};
use reqwest::Url;
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
use url::Host;

const MAX_REDIRECTS: usize = 10;

pub struct PublicOnly;

impl Resolve for PublicOnly {
    fn resolve(&self, name: Name) -> Resolving {
        Box::pin(async move {
            let found = tokio::net::lookup_host((name.as_str(), 0)).await?;
            let public: Vec<_> = found.filter(|addr| !is_private(addr.ip())).collect();
            if public.is_empty() {
                return Err(format!("{} resolves only to private addresses", name.as_str()).into());
            }
            let addrs: Addrs = Box::new(public.into_iter());
            Ok(addrs)
        })
    }
}

pub fn redirects() -> Policy {
    Policy::custom(|attempt: Attempt| {
        if is_local(attempt.url()) {
            attempt.stop()
        } else if attempt.previous().len() >= MAX_REDIRECTS {
            attempt.error("too many redirects")
        } else {
            attempt.follow()
        }
    })
}

pub fn is_local(url: &Url) -> bool {
    match url.host() {
        Some(Host::Domain(domain)) => {
            let domain = domain.trim_end_matches('.').to_ascii_lowercase();
            domain == "localhost" || domain.ends_with(".localhost") || domain.ends_with(".local")
        }
        Some(Host::Ipv4(ip)) => is_private(IpAddr::V4(ip)),
        Some(Host::Ipv6(ip)) => is_private(IpAddr::V6(ip)),
        None => true,
    }
}

fn is_private(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => is_private_v4(v4),
        IpAddr::V6(v6) => embedded_v4(v6).map_or_else(|| is_private_v6(v6), is_private_v4),
    }
}

fn is_private_v4(ip: Ipv4Addr) -> bool {
    let [a, b, ..] = ip.octets();
    ip.is_private()
        || ip.is_loopback()
        || ip.is_link_local()
        || ip.is_unspecified()
        || ip.is_broadcast()
        || (a == 100 && b & 0xc0 == 64)
}

fn is_private_v6(ip: Ipv6Addr) -> bool {
    let first = ip.segments()[0];
    ip.is_loopback() || ip.is_unspecified() || first & 0xfe00 == 0xfc00 || first & 0xffc0 == 0xfe80
}

fn embedded_v4(ip: Ipv6Addr) -> Option<Ipv4Addr> {
    let s = ip.segments();
    let nat64 = s[0] == 0x64 && s[1] == 0xff9b && s[2..6] == [0, 0, 0, 0];
    if nat64 {
        let [.., hi, lo] = s;
        return Some(Ipv4Addr::from((u32::from(hi) << 16) | u32::from(lo)));
    }
    ip.to_ipv4_mapped()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn local(raw: &str) -> bool {
        is_local(&Url::parse(raw).unwrap())
    }

    #[test]
    fn local_and_private_hosts_are_caught() {
        for raw in [
            "http://localhost:8080/",
            "http://localhost.:8080/",
            "http://app.localhost/",
            "http://printer.local/",
            "http://127.0.0.1/",
            "http://0.0.0.0/",
            "http://192.168.1.1/",
            "http://10.0.0.2/",
            "http://100.64.0.1/",
            "http://169.254.1.1/",
            "http://[::1]/",
            "http://[::ffff:127.0.0.1]/",
            "http://[64:ff9b::7f00:1]/",
            "http://[fd00::1]/",
            "http://[fe80::1]/",
            "http://2130706433/",
        ] {
            assert!(local(raw), "{raw}");
        }
    }

    #[test]
    fn public_hosts_pass() {
        for raw in [
            "https://example.com/",
            "https://8.8.8.8/",
            "https://[2606:4700::1111]/",
            "https://100.128.0.1/",
        ] {
            assert!(!local(raw), "{raw}");
        }
    }
}
