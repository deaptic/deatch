const MAX_ENTITY_LENGTH: usize = 10;

pub fn decode(text: &str) -> String {
    let mut decoded = String::with_capacity(text.len());
    let mut rest = text;
    while let Some(start) = rest.find('&') {
        decoded.push_str(&rest[..start]);
        let tail = &rest[start..];
        let found = tail
            .find(';')
            .filter(|end| *end <= MAX_ENTITY_LENGTH)
            .and_then(|end| entity(&tail[1..end]).map(|c| (c, end)));
        match found {
            Some((c, end)) => {
                decoded.push(c);
                rest = &tail[end + 1..];
            }
            None => {
                decoded.push('&');
                rest = &tail[1..];
            }
        }
    }
    decoded.push_str(rest);
    decoded
}

fn entity(name: &str) -> Option<char> {
    match name {
        "amp" => Some('&'),
        "lt" => Some('<'),
        "gt" => Some('>'),
        "quot" => Some('"'),
        "apos" => Some('\x27'),
        "nbsp" => Some(' '),
        "mdash" => Some('—'),
        "ndash" => Some('–'),
        "hellip" => Some('…'),
        _ => {
            let code = match name.strip_prefix("#x").or_else(|| name.strip_prefix("#X")) {
                Some(hex) => u32::from_str_radix(hex, 16).ok()?,
                None => name.strip_prefix('#')?.parse().ok()?,
            };
            char::from_u32(code)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn entities_decode_once() {
        assert_eq!(decode("&amp;lt;"), "&lt;");
    }

    #[test]
    fn numeric_entities_decode_and_stray_ampersands_stay() {
        assert_eq!(
            decode("Twitch (&#064;a) &#x2022; Tom & Jerry &#39;hi&#39; &bogus;"),
            "Twitch (@a) • Tom & Jerry 'hi' &bogus;"
        );
    }
}
