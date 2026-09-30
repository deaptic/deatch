pub fn init_store() {
    #[cfg(target_os = "windows")]
    {
        match windows_native_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => log::error!("keyring store init failed: {e}"),
        }
    }
    #[cfg(target_os = "macos")]
    {
        match apple_native_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => log::error!("keyring store init failed: {e}"),
        }
    }
    #[cfg(any(target_os = "linux", target_os = "freebsd"))]
    {
        match dbus_secret_service_keyring_store::Store::new() {
            Ok(store) => keyring_core::set_default_store(store),
            Err(e) => log::error!("keyring store init failed: {e}"),
        }
    }
}
