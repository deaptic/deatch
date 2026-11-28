const DEV: bool = cfg!(debug_assertions);

pub const PRODUCT_NAME: &str = if DEV { "Deatch Dev" } else { "Deatch" };
pub const KEYRING_SERVICE: &str = if DEV { "deatch-dev" } else { "deatch" };
pub const PIPE_PREFIX: &str = if DEV {
    "deatch-dev-bridge"
} else {
    "deatch-bridge"
};
pub const WIDGET_PORT: u16 = if DEV { 47821 } else { 47820 };
const IDENTIFIER_SUFFIX: &str = if DEV { ".dev" } else { "" };

pub fn apply<R: tauri::Runtime>(context: &mut tauri::Context<R>) {
    let config = context.config_mut();
    config.identifier.push_str(IDENTIFIER_SUFFIX);
    config.product_name = Some(PRODUCT_NAME.into());
    context.package_info_mut().name = PRODUCT_NAME.into();
}
