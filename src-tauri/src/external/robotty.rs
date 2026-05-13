//! Fetches chat backlog from recent-messages.robotty.de (community IRC mirror)
//! and maps each PRIVMSG to the shape of our EventSub `channel.chat.message`
//! events so the renderer can consume both without a separate code path.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

// ── Output shape (mirrors `RawChatMessage` in src/types.ts) ────────────────

#[derive(Serialize)]
pub struct RecentMessage {
    pub broadcaster_user_id: String,
    pub message_id: String,
    pub chatter_user_id: String,
    pub chatter_user_login: String,
    pub chatter_user_name: String,
    pub color: String,
    pub message: MessageBody,
    pub message_type: String,
    pub badges: Vec<Badge>,
    pub reply: Option<Reply>,
    pub channel_points_custom_reward_id: Option<String>,
    pub timestamp_ms: i64,
    pub deleted: bool,
}

#[derive(Serialize)]
pub struct MessageBody {
    pub text: String,
    pub fragments: Vec<Fragment>,
}

#[derive(Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Fragment {
    Text { text: String },
    Emote { text: String, emote: EmoteRef },
    Mention { text: String, mention: MentionRef },
}

#[derive(Serialize)]
pub struct EmoteRef {
    pub id: String,
}

#[derive(Serialize)]
pub struct MentionRef {
    pub user_login: String,
}

#[derive(Serialize)]
pub struct Badge {
    pub set_id: String,
    pub id: String,
    pub info: String,
}

#[derive(Serialize)]
pub struct Reply {
    pub parent_message_id: String,
    pub parent_message_body: String,
    pub parent_user_name: String,
    pub parent_user_login: String,
}

// ── IRC envelope ───────────────────────────────────────────────────────────

type Tags = HashMap<String, String>;

/// Splits an IRC line into its tags, nick, command verb and body.
fn split_irc(line: &str) -> Option<(Tags, &str, &str, &str)> {
    let rest = line.strip_prefix('@')?;
    let (tags, rest) = rest.split_once(' ')?;
    let rest = rest.strip_prefix(':')?;
    let (prefix, rest) = rest.split_once(' ')?;
    let (command, rest) = rest.split_once(' ')?;
    let nick = prefix.split('!').next()?;
    // Trailing-param `:` is optional when the body has no spaces, so
    // `PRIVMSG #channel Kappa` is valid IRC. Split off the channel first,
    // then strip an optional leading `:` from what's left.
    let body = rest
        .split_once(' ')
        .map_or("", |(_, b)| b.strip_prefix(':').unwrap_or(b));
    Some((parse_tags(tags), nick, command, body))
}

fn parse_tags(s: &str) -> Tags {
    s.split(';')
        .filter_map(|kv| kv.split_once('='))
        .map(|(k, v)| (k.to_string(), unescape(v)))
        .collect()
}

/// IRCv3 tag value un-escape: `\:` → `;`, `\s` → ` `, `\\` → `\`, etc.
fn unescape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c != '\\' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some(':') => out.push(';'),
            Some('s') => out.push(' '),
            Some('r') => out.push('\r'),
            Some('n') => out.push('\n'),
            Some(other) => out.push(other),
            None => {}
        }
    }
    out
}

// ── PRIVMSG → RecentMessage ────────────────────────────────────────────────

fn parse_privmsg(tags: &Tags, nick: &str, body: &str) -> RecentMessage {
    let text = body
        .strip_prefix("\u{0001}ACTION ")
        .and_then(|s| s.strip_suffix('\u{0001}'))
        .unwrap_or(body)
        .to_string();

    let tag = |k: &str| tags.get(k).cloned().unwrap_or_default();
    let display_name = tags
        .get("display-name")
        .filter(|s| !s.is_empty())
        .cloned()
        .unwrap_or_else(|| nick.to_string());

    RecentMessage {
        broadcaster_user_id: tag("room-id"),
        message_id: tag("id"),
        chatter_user_id: tag("user-id"),
        chatter_user_login: nick.to_string(),
        chatter_user_name: display_name,
        color: tag("color"),
        message: MessageBody {
            fragments: build_fragments(&text, tags.get("emotes").map_or("", String::as_str)),
            text,
        },
        message_type: if tag("first-msg") == "1" { "user_intro".into() } else { "text".into() },
        badges: parse_badges(tags),
        reply: parse_reply(tags),
        channel_points_custom_reward_id: tags
            .get("custom-reward-id")
            .filter(|s| !s.is_empty())
            .cloned(),
        timestamp_ms: tag("tmi-sent-ts").parse().unwrap_or(0),
        deleted: false,
    }
}

fn parse_badges(tags: &Tags) -> Vec<Badge> {
    let badges = tags.get("badges").map_or("", String::as_str);
    if badges.is_empty() {
        return Vec::new();
    }
    let info: HashMap<&str, &str> = tags
        .get("badge-info")
        .map_or("", String::as_str)
        .split(',')
        .filter_map(|b| b.split_once('/'))
        .collect();
    badges
        .split(',')
        .filter_map(|b| b.split_once('/'))
        .map(|(set_id, id)| Badge {
            info: info.get(set_id).map_or_else(String::new, |s| s.to_string()),
            set_id: set_id.to_string(),
            id: id.to_string(),
        })
        .collect()
}

fn parse_reply(tags: &Tags) -> Option<Reply> {
    let parent_message_id = tags.get("reply-parent-msg-id").filter(|s| !s.is_empty())?.clone();
    let get = |k| tags.get(k).cloned().unwrap_or_default();
    Some(Reply {
        parent_message_id,
        parent_message_body: get("reply-parent-msg-body"),
        parent_user_name: get("reply-parent-display-name"),
        parent_user_login: get("reply-parent-user-login"),
    })
}

/// Slices the message text into Text / Emote / Mention fragments using the
/// `emotes` IRC tag for emote positions and a `@\w+` scan for mentions.
fn build_fragments(text: &str, emotes_tag: &str) -> Vec<Fragment> {
    enum Kind { Emote(String), Mention(String) }
    let chars: Vec<char> = text.chars().collect();
    let mut spans: Vec<(usize, usize, Kind)> = Vec::new();

    for emote in emotes_tag.split('/').filter(|s| !s.is_empty()) {
        let Some((id, ranges)) = emote.split_once(':') else { continue };
        for range in ranges.split(',') {
            let Some((s, e)) = range.split_once('-') else { continue };
            if let (Ok(s), Ok(e)) = (s.parse::<usize>(), e.parse::<usize>()) {
                spans.push((s, e + 1, Kind::Emote(id.into())));
            }
        }
    }

    let is_login = |c: char| c.is_ascii_alphanumeric() || c == '_';
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '@' && chars.get(i + 1).is_some_and(|&c| is_login(c)) {
            let start = i;
            i += 1;
            while i < chars.len() && is_login(chars[i]) {
                i += 1;
            }
            let login: String = chars[start + 1..i].iter().collect::<String>().to_lowercase();
            spans.push((start, i, Kind::Mention(login)));
        } else {
            i += 1;
        }
    }

    spans.sort_by_key(|s| s.0);

    let slice = |s: usize, e: usize| -> String {
        chars[s..e.min(chars.len())].iter().collect()
    };
    let mut out: Vec<Fragment> = Vec::new();
    let mut cursor = 0usize;
    for (s, e, kind) in spans {
        if s < cursor { continue; }
        if s > cursor {
            out.push(Fragment::Text { text: slice(cursor, s) });
        }
        let text = slice(s, e);
        out.push(match kind {
            Kind::Emote(id) => Fragment::Emote { text, emote: EmoteRef { id } },
            Kind::Mention(user_login) => Fragment::Mention { text, mention: MentionRef { user_login } },
        });
        cursor = e;
    }
    if cursor < chars.len() {
        out.push(Fragment::Text { text: slice(cursor, chars.len()) });
    }
    if out.is_empty() {
        out.push(Fragment::Text { text: String::new() });
    }
    out
}

// ── Fetch + delete sweep ───────────────────────────────────────────────────

#[derive(Deserialize)]
struct RobottyResponse {
    messages: Vec<String>,
}

pub async fn fetch_recent_messages(
    channel_login: &str,
    limit: usize,
) -> Result<Vec<RecentMessage>, String> {
    let url = format!(
        "https://recent-messages.robotty.de/api/v2/recent-messages/{channel_login}?limit={limit}"
    );
    let resp: RobottyResponse = reqwest::Client::new()
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let mut messages: Vec<RecentMessage> = Vec::new();
    let mut deleted_ids: HashSet<String> = HashSet::new();
    let mut user_clears: Vec<(String, i64)> = Vec::new();
    let mut full_clears: Vec<i64> = Vec::new();

    for line in &resp.messages {
        let Some((tags, nick, command, body)) = split_irc(line) else { continue };
        match command {
            "PRIVMSG" => messages.push(parse_privmsg(&tags, nick, body)),
            "CLEARMSG" => {
                if let Some(id) = tags.get("target-msg-id") {
                    deleted_ids.insert(id.clone());
                }
            }
            "CLEARCHAT" => {
                let ts = tags
                    .get("tmi-sent-ts")
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(i64::MAX);
                match tags.get("target-user-id") {
                    Some(uid) if !uid.is_empty() => user_clears.push((uid.clone(), ts)),
                    _ => full_clears.push(ts),
                }
            }
            _ => {}
        }
    }

    for m in &mut messages {
        m.deleted = deleted_ids.contains(&m.message_id)
            || user_clears
                .iter()
                .any(|(uid, ts)| uid == &m.chatter_user_id && m.timestamp_ms <= *ts)
            || full_clears.iter().any(|ts| m.timestamp_ms <= *ts);
    }

    Ok(messages)
}

// ── Tauri command ──────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetRecentMessagesParams {
    pub channel_login: String,
    pub limit: Option<usize>,
}

#[tauri::command]
pub async fn get_recent_messages(
    params: GetRecentMessagesParams,
) -> Result<Vec<RecentMessage>, String> {
    fetch_recent_messages(&params.channel_login, params.limit.unwrap_or(50)).await
}
