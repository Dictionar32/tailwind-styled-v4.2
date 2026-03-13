use napi_derive::napi;
use regex::Regex;

#[napi(object)]
pub struct ParsedClass {
  pub raw: String,
  pub base: String,
  pub variants: Vec<String>,
  pub modifier_type: Option<String>,
  pub modifier_value: Option<String>,
}

#[napi]
pub fn parse_classes(input: String) -> Vec<ParsedClass> {
  let token_re = Regex::new(r"\S+").unwrap();
  let opacity_re = Regex::new(r"^(.*)/(\d{1,3})$").unwrap();
  let arbitrary_re = Regex::new(r"\((--[a-zA-Z0-9_-]+)\)").unwrap();

  let mut out: Vec<ParsedClass> = Vec::new();

  for m in token_re.find_iter(&input) {
    let token = m.as_str();
    let parts: Vec<&str> = token.split(':').collect();
    let variants = if parts.len() > 1 {
      parts[0..parts.len() - 1]
        .iter()
        .map(|s| s.to_string())
        .collect()
    } else {
      Vec::new()
    };

    let base = parts.last().unwrap_or(&"").to_string();

    let mut parsed = ParsedClass {
      raw: token.to_string(),
      base: base.clone(),
      variants,
      modifier_type: None,
      modifier_value: None,
    };

    if let Some(c) = opacity_re.captures(&base) {
      parsed.base = c[1].to_string();
      parsed.modifier_type = Some("opacity".to_string());
      parsed.modifier_value = Some(c[2].to_string());
    } else if let Some(c) = arbitrary_re.captures(&base) {
      parsed.modifier_type = Some("arbitrary".to_string());
      parsed.modifier_value = Some(c[1].to_string());
    }

    out.push(parsed);
  }

  out
}
