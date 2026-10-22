//! Maps a USERNOTICE to the shape of EventSub's `channel.chat.notification`,
//! translating IRC `msg-id`s and `msg-param-*` tags to EventSub's names.

use super::dto::{
    AnnouncementNotice, BitsBadgeTierNotice, CharityAmount, CharityDonationNotice,
    CommunitySubGiftNotice, GifterNotice, MessageBody, PrimePaidUpgradeNotice, RaidNotice,
    RecentNotice, ResubNotice, SubGiftNotice, SubNotice, SubTier,
};
use super::{build_fragments, nonempty, tag, Tags};
use std::str::FromStr;

const ANONYMOUS_LOGIN: &str = "ananonymousgifter";

fn num<T: FromStr>(tags: &Tags, key: &str) -> Option<T> {
    tag(tags, key).parse().ok()
}

/// Twitch writes zero for counts the chatter chose to hide.
fn shown_count(tags: &Tags, key: &str) -> Option<u32> {
    num(tags, key).filter(|n| *n > 0)
}

/// A Prime sub counts as Tier 1, as on EventSub.
fn plan(tags: &Tags) -> Option<(SubTier, bool)> {
    match tag(tags, "msg-param-sub-plan") {
        "Prime" => Some((SubTier::Tier1, true)),
        "1000" => Some((SubTier::Tier1, false)),
        "2000" => Some((SubTier::Tier2, false)),
        "3000" => Some((SubTier::Tier3, false)),
        _ => None,
    }
}

/// Links a community gift to each of its subs. Not in Twitch's IRC docs, but
/// sent on both, and equal to EventSub's `community_gift_id`.
fn community_gift_id(tags: &Tags) -> Option<String> {
    nonempty(tags, "msg-param-community-gift-id").map(Into::into)
}

fn tier(tags: &Tags) -> Option<SubTier> {
    plan(tags).map(|(tier, _)| tier)
}

pub(super) fn parse_usernotice(tags: &Tags, body: &str) -> RecentNotice {
    let login = tag(tags, "login");
    let shared = tag(tags, "msg-id") == "sharedchatnotice";
    let msg_id = tag(tags, if shared { "source-msg-id" } else { "msg-id" });
    let mut notice = RecentNotice {
        broadcaster_user_id: tag(tags, "room-id").into(),
        message_id: tag(tags, "id").into(),
        notice_type: String::new(),
        system_message: tag(tags, "system-msg").into(),
        chatter_is_anonymous: login == ANONYMOUS_LOGIN,
        chatter_user_id: tag(tags, "user-id").into(),
        chatter_user_login: login.into(),
        chatter_user_name: nonempty(tags, "display-name").unwrap_or(login).into(),
        color: tag(tags, "color").into(),
        message: MessageBody {
            fragments: build_fragments(body, tag(tags, "emotes")),
            text: body.into(),
        },
        timestamp_ms: num(tags, "tmi-sent-ts").unwrap_or(0),
        sub: None,
        resub: None,
        sub_gift: None,
        community_sub_gift: None,
        gift_paid_upgrade: None,
        prime_paid_upgrade: None,
        pay_it_forward: None,
        raid: None,
        bits_badge_tier: None,
        charity_donation: None,
        announcement: None,
    };
    let notice_type = add_detail(&mut notice, msg_id, tags);
    notice.notice_type = if shared {
        format!("shared_chat_{notice_type}")
    } else {
        notice_type.into()
    };
    notice
}

/// Fills the detail for `msg_id` and returns its EventSub notice type. An
/// unknown `msg_id` passes through and renders Twitch's `system-msg`.
fn add_detail<'a>(notice: &mut RecentNotice, msg_id: &'a str, tags: &Tags) -> &'a str {
    match msg_id {
        "sub" => {
            notice.sub = plan(tags).map(|(sub_tier, is_prime)| SubNotice { sub_tier, is_prime });
            "sub"
        }
        "resub" => {
            notice.resub = plan(tags).map(|(sub_tier, is_prime)| ResubNotice {
                sub_tier,
                is_prime,
                cumulative_months: num(tags, "msg-param-cumulative-months").unwrap_or(0),
                streak_months: shown_count(tags, "msg-param-streak-months"),
            });
            "resub"
        }
        "subgift" => {
            notice.sub_gift = tier(tags).map(|sub_tier| SubGiftNotice {
                sub_tier,
                recipient_user_id: nonempty(tags, "msg-param-recipient-id").map(Into::into),
                recipient_user_login: tag(tags, "msg-param-recipient-user-name").into(),
                recipient_user_name: tag(tags, "msg-param-recipient-display-name").into(),
                cumulative_total: shown_count(tags, "msg-param-sender-count"),
                community_gift_id: community_gift_id(tags),
            });
            "sub_gift"
        }
        "submysterygift" => {
            notice.community_sub_gift = tier(tags).map(|sub_tier| CommunitySubGiftNotice {
                id: community_gift_id(tags),
                sub_tier,
                total: num(tags, "msg-param-mass-gift-count").unwrap_or(0),
                cumulative_total: shown_count(tags, "msg-param-sender-count"),
            });
            "community_sub_gift"
        }
        "giftpaidupgrade" | "anongiftpaidupgrade" => {
            let gifter = nonempty(tags, "msg-param-sender-name");
            notice.gift_paid_upgrade = Some(GifterNotice {
                gifter_is_anonymous: msg_id == "anongiftpaidupgrade" || gifter.is_none(),
                gifter_user_name: gifter.map(Into::into),
            });
            "gift_paid_upgrade"
        }
        "primepaidupgrade" => {
            notice.prime_paid_upgrade =
                tier(tags).map(|sub_tier| PrimePaidUpgradeNotice { sub_tier });
            "prime_paid_upgrade"
        }
        "communitypayforward" | "standardpayforward" => {
            let gifter = nonempty(tags, "msg-param-prior-gifter-display-name");
            notice.pay_it_forward = Some(GifterNotice {
                gifter_is_anonymous: tag(tags, "msg-param-prior-gifter-anonymous") == "true"
                    || gifter.is_none(),
                gifter_user_name: gifter.map(Into::into),
            });
            "pay_it_forward"
        }
        "raid" => {
            notice.raid = Some(RaidNotice {
                user_name: tag(tags, "msg-param-displayName").into(),
                viewer_count: num(tags, "msg-param-viewerCount").unwrap_or(0),
            });
            "raid"
        }
        "bitsbadgetier" => {
            notice.bits_badge_tier =
                num(tags, "msg-param-threshold").map(|tier| BitsBadgeTierNotice { tier });
            "bits_badge_tier"
        }
        "charitydonation" => {
            notice.charity_donation =
                num(tags, "msg-param-donation-amount").map(|value| CharityDonationNotice {
                    charity_name: tag(tags, "msg-param-charity-name").into(),
                    amount: CharityAmount {
                        value,
                        decimal_place: num(tags, "msg-param-exponent").unwrap_or(0),
                        currency: tag(tags, "msg-param-donation-currency").into(),
                    },
                });
            "charity_donation"
        }
        "announcement" => {
            notice.announcement =
                nonempty(tags, "msg-param-color").map(|color| AnnouncementNotice {
                    color: color.into(),
                });
            "announcement"
        }
        other => other,
    }
}

#[cfg(test)]
mod tests {
    use super::super::split_irc;
    use super::*;
    use serde_json::{json, Value};

    fn notice(line: &str) -> Value {
        let (tags, _, _, body) = split_irc(line).unwrap();
        serde_json::to_value(parse_usernotice(&tags, body)).unwrap()
    }

    #[test]
    fn maps_a_resub_with_its_message() {
        let n = notice(
            "@msg-id=resub;msg-param-sub-plan=2000;msg-param-cumulative-months=14;\
             msg-param-streak-months=3;login=foo;display-name=Foo;user-id=2;room-id=1;id=n1;\
             tmi-sent-ts=500;system-msg=Foo\\ssubscribed;emotes=25:4-8 \
             :tmi.twitch.tv USERNOTICE #chan :yay Kappa",
        );
        assert_eq!(n["notice_type"], "resub");
        assert_eq!(n["message_id"], "n1");
        assert_eq!(n["chatter_user_name"], "Foo");
        assert_eq!(n["system_message"], "Foo subscribed");
        assert_eq!(n["timestamp_ms"], 500);
        assert_eq!(
            n["resub"],
            json!({ "sub_tier": "2000", "is_prime": false, "cumulative_months": 14, "streak_months": 3 })
        );
        assert_eq!(n["message"]["text"], "yay Kappa");
        assert_eq!(n["message"]["fragments"][1]["emote"]["id"], "25");
        assert_eq!(n["sub"], Value::Null);
    }

    #[test]
    fn hides_zero_counts_and_marks_prime() {
        let n = notice(
            "@msg-id=resub;msg-param-sub-plan=Prime;msg-param-cumulative-months=2;\
             msg-param-streak-months=0;login=foo;id=n1 :tmi.twitch.tv USERNOTICE #chan",
        );
        assert_eq!(n["resub"]["is_prime"], true);
        assert_eq!(n["resub"]["sub_tier"], "1000");
        assert_eq!(n["resub"]["streak_months"], Value::Null);
    }

    #[test]
    fn maps_an_anonymous_gift() {
        let n = notice(
            "@msg-id=subgift;msg-param-sub-plan=1000;msg-param-recipient-display-name=Bar;\
             msg-param-recipient-user-name=bar;msg-param-recipient-id=7;\
             msg-param-sender-count=0;login=ananonymousgifter;id=n1 :tmi.twitch.tv USERNOTICE #chan",
        );
        assert_eq!(n["notice_type"], "sub_gift");
        assert_eq!(n["chatter_is_anonymous"], true);
        assert_eq!(
            n["sub_gift"],
            json!({
                "sub_tier": "1000",
                "recipient_user_id": "7",
                "recipient_user_login": "bar",
                "recipient_user_name": "Bar",
                "cumulative_total": null,
                "community_gift_id": null,
            })
        );
    }

    // Tags as robotty serves them for one sub of a community gift.
    #[test]
    fn links_a_community_gift_and_its_subs() {
        let community = notice(
            "@msg-id=submysterygift;msg-param-community-gift-id=917;msg-param-sub-plan=1000;\
             msg-param-mass-gift-count=1;msg-param-sender-count=213;login=luka;id=n1 \
             :tmi.twitch.tv USERNOTICE #chan",
        );
        let member = notice(
            "@msg-id=subgift;msg-param-community-gift-id=917;msg-param-sub-plan=1000;\
             msg-param-recipient-display-name=o7nate_;msg-param-sender-count=0;login=luka;id=n2 \
             :tmi.twitch.tv USERNOTICE #chan",
        );
        assert_eq!(community["community_sub_gift"]["id"], "917");
        assert_eq!(member["sub_gift"]["community_gift_id"], "917");
    }

    #[test]
    fn maps_a_raid() {
        let n = notice(
            "@msg-id=raid;msg-param-displayName=Raider;msg-param-viewerCount=42;login=raider;id=n1 \
             :tmi.twitch.tv USERNOTICE #chan",
        );
        assert_eq!(
            n["raid"],
            json!({ "user_name": "Raider", "viewer_count": 42 })
        );
    }

    #[test]
    fn prefixes_shared_chat_notices() {
        let n = notice(
            "@msg-id=sharedchatnotice;source-msg-id=announcement;login=foo;id=n1 \
             :tmi.twitch.tv USERNOTICE #chan :hello",
        );
        assert_eq!(n["notice_type"], "shared_chat_announcement");
    }

    #[test]
    fn keeps_an_announcement_colour() {
        let n = notice(
            "@msg-id=announcement;msg-param-color=PURPLE;login=foo;id=n1 \
             :tmi.twitch.tv USERNOTICE #chan :hello",
        );
        assert_eq!(n["announcement"], json!({ "color": "PURPLE" }));
    }

    #[test]
    fn passes_unknown_notices_through() {
        let n = notice(
            "@msg-id=viewermilestone;system-msg=Foo\\swatched\\s5\\sstreams;login=foo;id=n1 \
             :tmi.twitch.tv USERNOTICE #chan",
        );
        assert_eq!(n["notice_type"], "viewermilestone");
        assert_eq!(n["system_message"], "Foo watched 5 streams");
    }
}
