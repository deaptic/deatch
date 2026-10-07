pub fn init_store() {
    match windows_native_keyring_store::Store::new() {
        Ok(store) => keyring_core::set_default_store(store),
        Err(e) => log::error!("keyring store init failed: {e}"),
    }
}
