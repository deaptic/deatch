//! Fetches chat backlog from recent-messages.robotty.de (community IRC mirror)
//! and maps each PRIVMSG to the shape of our EventSub `channel.chat.message`
//! events so the renderer can consume both without a separate code path.

pub mod commands;
pub mod dto;

use crate::error::Result;
use crate::http::get_json;
use dto::{ChatterBadge, EmoteRef, MentionRef, MessageBody, MessageFragment, RecentMessage, Reply};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};

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
        message_type: if tag("first-msg") == "1" {
            "user_intro".into()
        } else {
            "text".into()
        },
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

fn parse_badges(tags: &Tags) -> Vec<ChatterBadge> {
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
        .map(|(set_id, id)| ChatterBadge {
            info: info.get(set_id).map_or_else(String::new, |s| s.to_string()),
            set_id: set_id.to_string(),
            id: id.to_string(),
        })
        .collect()
}

fn parse_reply(tags: &Tags) -> Option<Reply> {
    let parent_message_id = tags
        .get("reply-parent-msg-id")
        .filter(|s| !s.is_empty())?
        .clone();
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
fn build_fragments(text: &str, emotes_tag: &str) -> Vec<MessageFragment> {
    enum Kind {
        Emote(String),
        Mention(String),
    }
    let chars: Vec<char> = text.chars().collect();
    let mut spans: Vec<(usize, usize, Kind)> = Vec::new();

    for emote in emotes_tag.split('/').filter(|s| !s.is_empty()) {
        let Some((id, ranges)) = emote.split_once(':') else {
            continue;
        };
        for range in ranges.split(',') {
            let Some((s, e)) = range.split_once('-') else {
                continue;
            };
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
            let login: String = chars[start + 1..i]
                .iter()
                .collect::<String>()
                .to_lowercase();
            spans.push((start, i, Kind::Mention(login)));
        } else {
            i += 1;
        }
    }

    spans.sort_by_key(|s| s.0);

    let slice = |s: usize, e: usize| -> String { chars[s..e.min(chars.len())].iter().collect() };
    let mut out: Vec<MessageFragment> = Vec::new();
    let mut cursor = 0usize;
    for (s, e, kind) in spans {
        if s < cursor {
            continue;
        }
        if s > cursor {
            out.push(MessageFragment::Text {
                text: slice(cursor, s),
            });
        }
        let text = slice(s, e);
        out.push(match kind {
            Kind::Emote(id) => MessageFragment::Emote {
                text,
                emote: EmoteRef { id },
            },
            Kind::Mention(user_login) => MessageFragment::Mention {
                text,
                mention: MentionRef { user_login },
            },
        });
        cursor = e;
    }
    if cursor < chars.len() {
        out.push(MessageFragment::Text {
            text: slice(cursor, chars.len()),
        });
    }
    if out.is_empty() {
        out.push(MessageFragment::Text {
            text: String::new(),
        });
    }
    out
}

#[derive(Deserialize)]
struct RobottyResponse {
    messages: Vec<String>,
}

pub async fn fetch_recent_messages(
    http: &reqwest::Client,
    channel_login: &str,
    limit: usize,
    after_unix_ms: Option<u64>,
) -> Result<Vec<RecentMessage>> {
    let mut url = format!(
        "https://recent-messages.robotty.de/api/v2/recent-messages/{channel_login}?limit={limit}"
    );
    if let Some(after) = after_unix_ms {
        url.push_str(&format!("&after={after}"));
    }
    let resp: RobottyResponse = get_json(http, &url).await?;
    Ok(parse_messages(&resp.messages))
}

fn parse_messages(lines: &[String]) -> Vec<RecentMessage> {
    let mut messages: Vec<RecentMessage> = Vec::new();
    let mut deleted_ids: HashSet<String> = HashSet::new();
    let mut user_clears: Vec<(String, i64)> = Vec::new();
    let mut full_clears: Vec<i64> = Vec::new();

    for line in lines {
        let Some((tags, nick, command, body)) = split_irc(line) else {
            continue;
        };
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

    messages
}
#[cfg(test)]
mod tests {
    use super::parse_messages;
    use crate::history::dto::RecentMessage;
    use serde_json::{json, Value};

    const PRIVMSG: &str = "@badge-info=subscriber/12;badges=subscriber/12,premium/1;color=#FF0000;\
        display-name=Foo;emotes=25:6-10;first-msg=0;id=m1;room-id=111;tmi-sent-ts=1000;user-id=222 \
        :foo!foo@foo.tmi.twitch.tv PRIVMSG #chan :hello Kappa @Bar";

    fn parse(lines: &[&str]) -> Vec<RecentMessage> {
        parse_messages(&lines.iter().map(|l| l.to_string()).collect::<Vec<_>>())
    }

    fn to_json<T: serde::Serialize>(value: &T) -> Value {
        serde_json::to_value(value).unwrap()
    }

    #[test]
    fn parses_privmsg_fields() {
        let m = &parse(&[PRIVMSG])[0];
        assert_eq!(m.message_id, "m1");
        assert_eq!(m.broadcaster_user_id, "111");
        assert_eq!(m.chatter_user_id, "222");
        assert_eq!(m.chatter_user_login, "foo");
        assert_eq!(m.chatter_user_name, "Foo");
        assert_eq!(m.color, "#FF0000");
        assert_eq!(m.message_type, "text");
        assert_eq!(m.timestamp_ms, 1000);
        assert!(!m.deleted);
        assert_eq!(
            to_json(&m.badges),
            json!([
                { "set_id": "subscriber", "id": "12", "info": "12" },
                { "set_id": "premium", "id": "1", "info": "" },
            ])
        );
    }

    #[test]
    fn splits_text_emote_and_mention_fragments() {
        let m = &parse(&[PRIVMSG])[0];
        assert_eq!(m.message.text, "hello Kappa @Bar");
        assert_eq!(
            to_json(&m.message.fragments),
            json!([
                { "type": "text", "text": "hello " },
                { "type": "emote", "text": "Kappa", "emote": { "id": "25" } },
                { "type": "text", "text": " " },
                { "type": "mention", "text": "@Bar", "mention": { "user_login": "bar" } },
            ])
        );
    }

    #[test]
    fn emote_positions_count_characters_not_bytes() {
        let line = "@emotes=25:6-10;id=m1;user-id=1 :foo!foo@foo PRIVMSG #chan :héllo Kappa";
        assert_eq!(
            to_json(&parse(&[line])[0].message.fragments),
            json!([
                { "type": "text", "text": "héllo " },
                { "type": "emote", "text": "Kappa", "emote": { "id": "25" } },
            ])
        );
    }

    #[test]
    fn strips_action_wrapper() {
        let line = "@id=m1;user-id=1 :foo!foo@foo PRIVMSG #chan :\u{1}ACTION waves\u{1}";
        assert_eq!(parse(&[line])[0].message.text, "waves");
    }

    #[test]
    fn accepts_body_without_trailing_colon() {
        let line = "@id=m1;user-id=1 :foo!foo@foo PRIVMSG #chan Kappa";
        assert_eq!(parse(&[line])[0].message.text, "Kappa");
    }

    #[test]
    fn marks_first_message_as_intro() {
        let line = "@first-msg=1;id=m1;user-id=1 :foo!foo@foo PRIVMSG #chan :hi";
        assert_eq!(parse(&[line])[0].message_type, "user_intro");
    }

    #[test]
    fn falls_back_to_nick_and_unescapes_tags() {
        let line = "@display-name=;reply-parent-msg-id=p1;reply-parent-msg-body=hey\\sthere;\
            reply-parent-display-name=Bar;reply-parent-user-login=bar;id=m1;user-id=1 \
            :foo!foo@foo PRIVMSG #chan :@bar yes";
        let m = &parse(&[line])[0];
        assert_eq!(m.chatter_user_name, "foo");
        assert_eq!(
            to_json(&m.reply),
            json!({
                "parent_message_id": "p1",
                "parent_message_body": "hey there",
                "parent_user_name": "Bar",
                "parent_user_login": "bar",
            })
        );
    }

    #[test]
    fn skips_malformed_lines() {
        assert!(parse(&["not irc", ":no tags PRIVMSG #chan :hi", ""]).is_empty());
    }

    #[test]
    fn applies_clearmsg_to_target_message() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :a!a@a PRIVMSG #chan :one",
            "@id=m2;user-id=1;tmi-sent-ts=200 :a!a@a PRIVMSG #chan :two",
            "@target-msg-id=m1;tmi-sent-ts=300 :tmi.twitch.tv CLEARMSG #chan :one",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, false]);
    }

    #[test]
    fn applies_user_clearchat_only_to_earlier_messages_of_that_user() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :a!a@a PRIVMSG #chan :before",
            "@id=m2;user-id=2;tmi-sent-ts=150 :b!b@b PRIVMSG #chan :other user",
            "@target-user-id=1;tmi-sent-ts=200 :tmi.twitch.tv CLEARCHAT #chan :a",
            "@id=m3;user-id=1;tmi-sent-ts=300 :a!a@a PRIVMSG #chan :after",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, false, false]);
    }

    #[test]
    fn applies_full_clearchat_to_every_earlier_message() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :a!a@a PRIVMSG #chan :one",
            "@id=m2;user-id=2;tmi-sent-ts=150 :b!b@b PRIVMSG #chan :two",
            "@tmi-sent-ts=200 :tmi.twitch.tv CLEARCHAT #chan",
            "@id=m3;user-id=1;tmi-sent-ts=300 :a!a@a PRIVMSG #chan :three",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, true, false]);
    }
}
