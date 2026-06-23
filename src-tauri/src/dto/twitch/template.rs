pub fn render_size(template: &str, width: u32, height: u32) -> String {
    template
        .replace("{width}", &width.to_string())
        .replace("{height}", &height.to_string())
}
