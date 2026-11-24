use super::dto::LinkPreview;
use super::entities;
use crate::platform::error::Result;
use reqwest::header::{ACCEPT, CONTENT_TYPE};
use reqwest::Url;
use std::collections::HashMap;
use url::Host;

const MAX_PAGE_BYTES: usize = 2 * 1024 * 1024;

pub async fn fetch(http: &reqwest::Client, url: Url) -> Result<Option<LinkPreview>> {
    if is_local(&url) {
        return Ok(None);
    }
    let mut response = http
        .get(url)
        .header(ACCEPT, "text/html, image/*")
        .send()
        .await?
        .error_for_status()?;
    if is_local(response.url()) {
        return Ok(None);
    }
    let content_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if content_type.starts_with("image/") {
        return Ok(Some(LinkPreview::Image {
            site: site_name(response.url()),
            url: response.url().to_string(),
        }));
    }
    if !content_type.contains("html") {
        return Ok(None);
    }
    let mut body = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        body.extend_from_slice(&chunk);
        if body.len() >= MAX_PAGE_BYTES {
            break;
        }
    }
    Ok(preview(&String::from_utf8_lossy(&body), response.url()))
}

fn is_local(url: &Url) -> bool {
    match url.host() {
        Some(Host::Domain(domain)) => {
            let domain = domain.to_ascii_lowercase();
            domain == "localhost" || domain.ends_with(".localhost") || domain.ends_with(".local")
        }
        Some(Host::Ipv4(ip)) => {
            ip.is_private() || ip.is_loopback() || ip.is_link_local() || ip.is_unspecified()
        }
        Some(Host::Ipv6(ip)) => {
            let first = ip.segments()[0];
            ip.is_loopback()
                || ip.is_unspecified()
                || first & 0xfe00 == 0xfc00
                || first & 0xffc0 == 0xfe80
        }
        None => true,
    }
}

pub fn preview(html: &str, url: &Url) -> Option<LinkPreview> {
    let meta = meta_tags(html);
    let pick = |keys: &[&str]| {
        keys.iter()
            .find_map(|key| meta.get(*key).filter(|v| !v.is_empty()).cloned())
    };
    let title = pick(&["og:title", "twitter:title"]).or_else(|| title_tag(html))?;
    let thumbnail = pick(&["og:image", "og:image:url", "twitter:image"])
        .and_then(|src| url.join(&src).ok())
        .filter(|image| matches!(image.scheme(), "https" | "http"))
        .map(String::from);
    let site = pick(&["og:site_name"]).unwrap_or_else(|| site_name(url));
    Some(LinkPreview::Card {
        site,
        title,
        description: pick(&["og:description", "twitter:description", "description"]),
        thumbnail,
        video: pick(&["og:type"]).is_some_and(|kind| kind.starts_with("video")),
    })
}

fn site_name(url: &Url) -> String {
    let host = url.host_str().unwrap_or_default();
    host.strip_prefix("www.").unwrap_or(host).to_owned()
}

fn meta_tags(html: &str) -> HashMap<String, String> {
    let lower = html.to_ascii_lowercase();
    let mut tags = HashMap::new();
    let mut from = 0;
    while let Some(found) = lower[from..].find("<meta") {
        let start = from + found + "<meta".len();
        let Some(length) = lower[start..].find('>') else {
            break;
        };
        let attributes = attributes(&html[start..start + length]);
        let key = attributes
            .get("property")
            .or_else(|| attributes.get("name"));
        if let (Some(key), Some(content)) = (key, attributes.get("content")) {
            tags.entry(key.to_ascii_lowercase())
                .or_insert_with(|| clean(content));
        }
        from = start + length;
    }
    tags
}

fn attributes(tag: &str) -> HashMap<String, String> {
    let mut found = HashMap::new();
    let mut rest = tag;
    loop {
        rest = rest.trim_start_matches(|c: char| c.is_whitespace() || c == '/');
        let name_end = rest
            .find(|c: char| c == '=' || c == '/' || c.is_whitespace())
            .unwrap_or(rest.len());
        if name_end == 0 {
            break;
        }
        let name = rest[..name_end].to_ascii_lowercase();
        rest = rest[name_end..].trim_start();
        let Some(value_start) = rest.strip_prefix('=').map(str::trim_start) else {
            found.insert(name, String::new());
            continue;
        };
        let (value, remaining) = match value_start.chars().next() {
            Some(quote @ ('"' | '\'')) => {
                let quoted = &value_start[1..];
                let close = quoted.find(quote).unwrap_or(quoted.len());
                (&quoted[..close], quoted.get(close + 1..).unwrap_or(""))
            }
            _ => {
                let close = value_start
                    .find(char::is_whitespace)
                    .unwrap_or(value_start.len());
                value_start.split_at(close)
            }
        };
        found.insert(name, value.to_owned());
        rest = remaining;
    }
    found
}

fn title_tag(html: &str) -> Option<String> {
    let lower = html.to_ascii_lowercase();
    let open = lower.find("<title")?;
    let start = open + lower[open..].find('>')? + 1;
    let end = start + lower[start..].find("</title>")?;
    Some(clean(&html[start..end])).filter(|title| !title.is_empty())
}

fn clean(text: &str) -> String {
    entities::decode(text)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(html: &str) -> Option<LinkPreview> {
        preview(html, &Url::parse("https://www.example.com/post/1").unwrap())
    }

    #[test]
    fn open_graph_tags_fill_the_card() {
        let html = r#"<html><head>
            <meta property="og:title" content="Big &amp; news">
            <META name='og:description' content='Read  all
              about it'>
            <meta property="og:image" content="/img/cover.png" />
            <meta property="og:site_name" content="Example">
            <meta property="og:type" content="video.other">
            <title>Ignored</title></head></html>"#;
        assert_eq!(
            page(html),
            Some(LinkPreview::Card {
                site: "Example".into(),
                title: "Big & news".into(),
                description: Some("Read all about it".into()),
                thumbnail: Some("https://www.example.com/img/cover.png".into()),
                video: true,
            })
        );
    }

    #[test]
    fn plain_pages_fall_back_to_the_title_tag_and_host() {
        let html =
            "<head><title>\n  Hello page </title><meta name=description content=Short></head>";
        assert_eq!(
            page(html),
            Some(LinkPreview::Card {
                site: "example.com".into(),
                title: "Hello page".into(),
                description: Some("Short".into()),
                thumbnail: None,
                video: false,
            })
        );
    }

    #[test]
    fn pages_without_a_title_have_no_preview() {
        assert_eq!(page("<p>hi</p>"), None);
    }

    #[test]
    fn images_must_be_web_links() {
        let html = r#"<meta property="og:title" content="T"><meta property="og:image" content="javascript:alert(1)">"#;
        assert!(matches!(
            page(html),
            Some(LinkPreview::Card {
                thumbnail: None,
                ..
            })
        ));
    }

    #[test]
    fn local_addresses_are_never_fetched() {
        for raw in [
            "http://localhost:8080/",
            "http://127.0.0.1/",
            "http://192.168.1.1/",
            "http://10.0.0.2/",
            "http://[::1]/",
            "http://printer.local/",
        ] {
            assert!(is_local(&Url::parse(raw).unwrap()), "{raw}");
        }
        assert!(!is_local(&Url::parse("https://example.com/").unwrap()));
    }
}
