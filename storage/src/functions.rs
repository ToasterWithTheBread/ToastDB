#![allow(non_snake_case)]

pub fn query_format(value: &str) -> &str {
    let mut chars = value.chars();
    chars.next();
    chars.next_back();
    chars.as_str()
}
