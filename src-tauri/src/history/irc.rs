use super::dto::{
    ChatterBadge, EmoteRef, GifRef, MentionRef, MessageBody, MessageFragment, MessageType,
    RecentHistory, RecentMessage, Reply,
};
use super::notice;
use crate::twitch::ids::EmoteId;
use std::collections::HashMap;

pub(super) type Tags = HashMap<String, String>;

pub(super) fn split_irc(line: &str) -> Option<(Tags, &str, &str, &str)> {
    let rest = line.strip_prefix('@')?;
    let (tags, rest) = rest.split_once(' ')?;
    let rest = rest.strip_prefix(':')?;
    let (prefix, rest) = rest.split_once(' ')?;
    let (command, rest) = rest.split_once(' ')?;
    let nick = prefix.split('!').next()?;
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

pub(super) fn tag<'a>(tags: &'a Tags, key: &str) -> &'a str {
    tags.get(key).map_or("", String::as_str)
}

pub(super) fn nonempty<'a>(tags: &'a Tags, key: &str) -> Option<&'a str> {
    Some(tag(tags, key)).filter(|value| !value.is_empty())
}

pub(super) fn sent_at_ms(tags: &Tags) -> i64 {
    let raw = tag(tags, "tmi-sent-ts");
    raw.parse().unwrap_or_else(|e| {
        log::warn!("recent message has unreadable tmi-sent-ts {raw:?}: {e}");
        0
    })
}

fn parse_privmsg(tags: &Tags, nick: &str, body: &str) -> RecentMessage {
    let text = body
        .strip_prefix("\u{0001}ACTION ")
        .and_then(|s| s.strip_suffix('\u{0001}'))
        .unwrap_or(body)
        .to_string();
    let source_room = nonempty(tags, "source-room-id").filter(|id| *id != tag(tags, "room-id"));

    RecentMessage {
        broadcaster_user_id: tag(tags, "room-id").into(),
        message_id: tag(tags, "id").into(),
        chatter_user_id: tag(tags, "user-id").into(),
        chatter_user_login: nick.into(),
        chatter_user_name: nonempty(tags, "display-name").unwrap_or(nick).into(),
        color: tag(tags, "color").into(),
        message: MessageBody {
            fragments: build_fragments(&text, tag(tags, "emotes"), tag(tags, "gifs")),
            text,
        },
        message_type: if tag(tags, "first-msg") == "1" {
            MessageType::UserIntro
        } else {
            MessageType::Text
        },
        badges: parse_badges(tags, "badges", "badge-info"),
        reply: parse_reply(tags),
        channel_points_custom_reward_id: nonempty(tags, "custom-reward-id").map(Into::into),
        timestamp_ms: sent_at_ms(tags),
        deleted: false,
        source_broadcaster_user_id: source_room.map(Into::into),
        source_message_id: source_room.and(nonempty(tags, "source-id")).map(Into::into),
        source_badges: source_room
            .map(|_| parse_badges(tags, "source-badges", "source-badge-info")),
    }
}

fn parse_badges(tags: &Tags, badges_key: &str, info_key: &str) -> Vec<ChatterBadge> {
    let info: HashMap<&str, &str> = tag(tags, info_key)
        .split(',')
        .filter_map(|b| b.split_once('/'))
        .collect();
    tag(tags, badges_key)
        .split(',')
        .filter_map(|b| b.split_once('/'))
        .map(|(set_id, id)| ChatterBadge {
            info: info.get(set_id).copied().unwrap_or_default().into(),
            set_id: set_id.into(),
            id: id.into(),
        })
        .collect()
}

fn parse_reply(tags: &Tags) -> Option<Reply> {
    Some(Reply {
        parent_message_id: nonempty(tags, "reply-parent-msg-id")?.into(),
        parent_message_body: tag(tags, "reply-parent-msg-body").into(),
        parent_user_name: tag(tags, "reply-parent-display-name").into(),
        parent_user_login: tag(tags, "reply-parent-user-login").into(),
        parent_user_id: tag(tags, "reply-parent-user-id").into(),
        thread_message_id: nonempty(tags, "reply-thread-parent-msg-id").map(Into::into),
        thread_user_login: nonempty(tags, "reply-thread-parent-user-login").map(Into::into),
    })
}

fn parse_gifs(gifs_tag: &str) -> Vec<(usize, usize, GifRef)> {
    let mut gifs: Vec<(usize, usize, GifRef)> = Vec::new();
    for piece in gifs_tag.split(',').filter(|s| !s.is_empty()) {
        match parse_gif(piece) {
            Some(gif) => gifs.push(gif),
            None => {
                if let Some((_, _, last)) = gifs.last_mut() {
                    last.url.push(',');
                    last.url.push_str(piece);
                }
            }
        }
    }
    gifs
}

fn parse_gif(entry: &str) -> Option<(usize, usize, GifRef)> {
    let mut parts = entry.splitn(3, '|');
    let (s, e) = parts.next()?.split_once('-')?;
    let (s, e) = (s.parse().ok()?, e.parse().ok()?);
    let id = parts.next()?.to_string();
    let url = parts.next()?.to_string();
    Some((s, e, GifRef { id, url }))
}

pub(super) fn build_fragments(
    text: &str,
    emotes_tag: &str,
    gifs_tag: &str,
) -> Vec<MessageFragment> {
    enum Kind {
        Emote(EmoteId),
        Mention(String),
        Gif(GifRef),
    }
    let chars: Vec<char> = text.chars().collect();
    let mut spans: Vec<(usize, usize, Kind)> = Vec::new();

    for (s, e, gif) in parse_gifs(gifs_tag) {
        if s <= e && s < chars.len() {
            spans.push((s, e.saturating_add(1), Kind::Gif(gif)));
        }
    }

    for emote in emotes_tag.split('/').filter(|s| !s.is_empty()) {
        let Some((id, ranges)) = emote.split_once(':') else {
            continue;
        };
        for range in ranges.split(',') {
            let Some((s, e)) = range.split_once('-') else {
                continue;
            };
            if let (Ok(s), Ok(e)) = (s.parse::<usize>(), e.parse::<usize>()) {
                if s <= e && s < chars.len() {
                    spans.push((s, e.saturating_add(1), Kind::Emote(id.into())));
                }
            }
        }
    }

    let is_login = |c: char| c.is_ascii_alphanumeric() || c == '_';
    let mut i = 0;
    while i < chars.len() {
        let word_start = i == 0 || !is_login(chars[i - 1]);
        if chars[i] == '@' && word_start && chars.get(i + 1).is_some_and(|&c| is_login(c)) {
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
            Kind::Gif(gif) => MessageFragment::Gif { text, gif },
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

pub(super) fn parse_messages(lines: &[String]) -> RecentHistory {
    let mut history = RecentHistory::default();
    for line in lines {
        let Some((tags, nick, command, body)) = split_irc(line) else {
            continue;
        };
        match command {
            "PRIVMSG" => history.messages.push(parse_privmsg(&tags, nick, body)),
            "USERNOTICE" => history.notices.push(notice::parse_usernotice(&tags, body)),
            "CLEARMSG" => {
                let target = nonempty(&tags, "target-msg-id");
                mark_deleted(&mut history.messages, |m| {
                    Some(m.message_id.as_str()) == target
                });
            }
            "CLEARCHAT" => {
                let user = nonempty(&tags, "target-user-id");
                mark_deleted(&mut history.messages, |m| {
                    user.is_none_or(|u| m.chatter_user_id.as_str() == u)
                });
            }
            _ => {}
        }
    }
    history
}

fn mark_deleted(messages: &mut [RecentMessage], cleared: impl Fn(&RecentMessage) -> bool) {
    for message in messages.iter_mut().filter(|m| cleared(m)) {
        message.deleted = true;
    }
}

#[cfg(test)]
mod tests {
    use super::{build_fragments, parse_messages, MessageType};
    use crate::history::dto::{RecentHistory, RecentMessage};
    use serde_json::{json, Value};

    const PRIVMSG: &str = "@badge-info=subscriber/12;badges=subscriber/12,premium/1;color=#FF0000;\
        display-name=Viewer1;emotes=25:6-10;first-msg=0;id=m1;room-id=111;tmi-sent-ts=1000;user-id=222 \
        :viewer1!viewer1@viewer1.tmi.twitch.tv PRIVMSG #broadcaster :hello Kappa @Viewer2";

    fn history(lines: &[&str]) -> RecentHistory {
        parse_messages(&lines.iter().map(|l| l.to_string()).collect::<Vec<_>>())
    }

    fn parse(lines: &[&str]) -> Vec<RecentMessage> {
        history(lines).messages
    }

    #[test]
    fn collects_notices_apart_from_messages() {
        let h = history(&[
            "@id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :one",
            "@msg-id=raid;id=n1;login=viewer2 :tmi.twitch.tv USERNOTICE #broadcaster",
            "@tmi-sent-ts=200 :tmi.twitch.tv CLEARCHAT #broadcaster",
        ]);
        assert_eq!(h.messages.len(), 1);
        assert_eq!(h.notices[0].message_id.as_str(), "n1");
    }

    fn to_json<T: serde::Serialize>(value: &T) -> Value {
        serde_json::to_value(value).unwrap()
    }

    #[test]
    fn parses_privmsg_fields() {
        let m = &parse(&[PRIVMSG])[0];
        assert_eq!(m.message_id.as_str(), "m1");
        assert_eq!(m.broadcaster_user_id.as_str(), "111");
        assert_eq!(m.chatter_user_id.as_str(), "222");
        assert_eq!(m.chatter_user_login, "viewer1");
        assert_eq!(m.chatter_user_name, "Viewer1");
        assert_eq!(m.color, "#FF0000");
        assert_eq!(m.message_type, MessageType::Text);
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
    fn keeps_shared_chat_source_only_for_partner_messages() {
        let partner = "@badges=;room-id=111;id=m1;user-id=2;source-room-id=999;\
            source-id=orig;source-badges=subscriber/6;source-badge-info=subscriber/7 \
            :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :hi";
        let local = "@room-id=111;id=m2;user-id=2;source-room-id=111;source-id=m2 \
            :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :hi";
        let m = parse(&[partner, local]);
        assert_eq!(
            m[0].source_broadcaster_user_id
                .as_ref()
                .map(|id| id.as_str()),
            Some("999")
        );
        assert_eq!(
            m[0].source_message_id.as_ref().map(|id| id.as_str()),
            Some("orig")
        );
        assert_eq!(
            to_json(&m[0].source_badges),
            json!([{ "set_id": "subscriber", "id": "6", "info": "7" }])
        );
        assert!(m[1].source_broadcaster_user_id.is_none());
        assert!(m[1].source_message_id.is_none());
        assert!(m[1].source_badges.is_none());
    }

    #[test]
    fn splits_text_emote_and_mention_fragments() {
        let m = &parse(&[PRIVMSG])[0];
        assert_eq!(m.message.text, "hello Kappa @Viewer2");
        assert_eq!(
            to_json(&m.message.fragments),
            json!([
                { "type": "text", "text": "hello " },
                { "type": "emote", "text": "Kappa", "emote": { "id": "25" } },
                { "type": "text", "text": " " },
                { "type": "mention", "text": "@Viewer2", "mention": { "user_login": "viewer2" } },
            ])
        );
    }

    #[test]
    fn mentions_start_only_at_a_word_boundary() {
        let fragments = to_json(&build_fragments("mail@host (@Viewer2", "", ""));
        assert_eq!(
            fragments,
            json!([
                { "type": "text", "text": "mail@host (" },
                { "type": "mention", "text": "@Viewer2", "mention": { "user_login": "viewer2" } },
            ])
        );
    }

    #[test]
    fn unreadable_sent_time_falls_back_to_zero() {
        let line = PRIVMSG.replace("tmi-sent-ts=1000", "tmi-sent-ts=soon");
        assert_eq!(parse(&[&line])[0].timestamp_ms, 0);
        assert_eq!(parse(&[PRIVMSG])[0].timestamp_ms, 1000);
    }

    #[test]
    fn emote_positions_count_characters_not_bytes() {
        let line = "@emotes=25:6-10;id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :héllo Kappa";
        assert_eq!(
            to_json(&parse(&[line])[0].message.fragments),
            json!([
                { "type": "text", "text": "héllo " },
                { "type": "emote", "text": "Kappa", "emote": { "id": "25" } },
            ])
        );
    }

    #[test]
    fn ignores_emote_ranges_outside_the_text() {
        let line =
            "@emotes=25:50-54/26:10-5/27:3-99;id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :hello";
        assert_eq!(
            to_json(&parse(&[line])[0].message.fragments),
            json!([
                { "type": "text", "text": "hel" },
                { "type": "emote", "text": "lo", "emote": { "id": "27" } },
            ])
        );
    }

    #[test]
    fn reads_gifs_with_commas_in_their_urls() {
        let line = "@gifs=0-10|g1|https://media.giphy.com/g1.gif?cid=a,b&ct=g;id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :[Hello GIF] @Viewer2";
        assert_eq!(
            to_json(&parse(&[line])[0].message.fragments),
            json!([
                { "type": "gif", "text": "[Hello GIF]", "gif": { "id": "g1", "url": "https://media.giphy.com/g1.gif?cid=a,b&ct=g" } },
                { "type": "text", "text": " " },
                { "type": "mention", "text": "@Viewer2", "mention": { "user_login": "viewer2" } },
            ])
        );
    }

    #[test]
    fn strips_action_wrapper() {
        let line = "@id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :\u{1}ACTION waves\u{1}";
        assert_eq!(parse(&[line])[0].message.text, "waves");
    }

    #[test]
    fn accepts_body_without_trailing_colon() {
        let line = "@id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster Kappa";
        assert_eq!(parse(&[line])[0].message.text, "Kappa");
    }

    #[test]
    fn marks_first_message_as_intro() {
        let line = "@first-msg=1;id=m1;user-id=1 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :hi";
        assert_eq!(parse(&[line])[0].message_type, MessageType::UserIntro);
    }

    #[test]
    fn falls_back_to_nick_and_unescapes_tags() {
        let line = "@display-name=;reply-parent-msg-id=p1;reply-parent-msg-body=hey\\sthere;\
            reply-parent-display-name=Viewer2;reply-parent-user-login=viewer2;reply-parent-user-id=7;\
            reply-thread-parent-msg-id=t1;reply-thread-parent-user-login=viewer3;\
            id=m1;user-id=1 \
            :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :@viewer2 yes";
        let m = &parse(&[line])[0];
        assert_eq!(m.chatter_user_name, "viewer1");
        assert_eq!(
            to_json(&m.reply),
            json!({
                "parent_message_id": "p1",
                "parent_message_body": "hey there",
                "parent_user_name": "Viewer2",
                "parent_user_login": "viewer2",
                "parent_user_id": "7",
                "thread_message_id": "t1",
                "thread_user_login": "viewer3",
            })
        );
    }

    #[test]
    fn skips_malformed_lines() {
        assert!(parse(&["not irc", ":no tags PRIVMSG #broadcaster :hi", ""]).is_empty());
    }

    #[test]
    fn applies_clearmsg_to_target_message() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :one",
            "@id=m2;user-id=1;tmi-sent-ts=200 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :two",
            "@target-msg-id=m1;tmi-sent-ts=300 :tmi.twitch.tv CLEARMSG #broadcaster :one",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, false]);
    }

    #[test]
    fn applies_user_clearchat_only_to_earlier_messages_of_that_user() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :before",
            "@id=m2;user-id=2;tmi-sent-ts=150 :viewer2!viewer2@viewer2 PRIVMSG #broadcaster :other user",
            "@target-user-id=1;tmi-sent-ts=200 :tmi.twitch.tv CLEARCHAT #broadcaster :viewer1",
            "@id=m3;user-id=1;tmi-sent-ts=300 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :after",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, false, false]);
    }

    #[test]
    fn applies_full_clearchat_to_every_earlier_message() {
        let messages = parse(&[
            "@id=m1;user-id=1;tmi-sent-ts=100 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :one",
            "@id=m2;user-id=2;tmi-sent-ts=150 :viewer2!viewer2@viewer2 PRIVMSG #broadcaster :two",
            "@tmi-sent-ts=200 :tmi.twitch.tv CLEARCHAT #broadcaster",
            "@id=m3;user-id=1;tmi-sent-ts=300 :viewer1!viewer1@viewer1 PRIVMSG #broadcaster :three",
        ]);
        let deleted: Vec<_> = messages.iter().map(|m| m.deleted).collect();
        assert_eq!(deleted, [true, true, false]);
    }
}
