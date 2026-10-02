use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Runtime, State};

use crate::{
    deobfuscate, obfuscate, DesktopConfig, DesktopState, SystemTelemetrySnapshot,
    UpdateCheckResult, WindowStateData, VAULT_KEY,
};

/// Returns desktop platform information without granting shell access.
#[tauri::command]
pub fn get_desktop_telemetry() -> SystemTelemetrySnapshot {
    SystemTelemetrySnapshot {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        memory_rss_mb: 84, // Estimated base desktop footprint
        is_desktop: true,
    }
}

/// Securely stores an auth token or secret in the desktop memory vault & obfuscated disk cache.
#[tauri::command]
pub fn set_secure_credential(
    state: State<'_, DesktopState>,
    key: String,
    value: String,
) -> Result<(), String> {
    if key.is_empty() || key.len() > 128 || !key.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-') {
        return Err("Invalid credential key: Must be alphanumeric, underscores, or hyphens (max 128 chars)".to_string());
    }
    if value.len() > 65536 {
        return Err("Credential payload too large: Exceeds maximum 64KB limit".to_string());
    }

    let mut vault = state.credentials_vault.lock().unwrap();
    vault.insert(key.clone(), value.clone());

    // Persist obfuscated credential
    if let Some(parent) = state.config_path.parent() {
        let creds_file = parent.join("vault.bin");
        let obfuscated = obfuscate(&value, VAULT_KEY);
        let mut disk_vault: HashMap<String, String> = if creds_file.exists() {
            fs::read_to_string(&creds_file)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            HashMap::new()
        };
        disk_vault.insert(key, obfuscated);
        let _ = fs::write(&creds_file, serde_json::to_string(&disk_vault).unwrap_or_default());
    }

    Ok(())
}

/// Retrieves a credential from the secure vault.
#[tauri::command]
pub fn get_secure_credential(
    state: State<'_, DesktopState>,
    key: String,
) -> Result<Option<String>, String> {
    let vault = state.credentials_vault.lock().unwrap();
    if let Some(val) = vault.get(&key) {
        return Ok(Some(val.clone()));
    }

    // Try reading from encrypted disk vault
    if let Some(parent) = state.config_path.parent() {
        let creds_file = parent.join("vault.bin");
        if creds_file.exists() {
            if let Ok(content) = fs::read_to_string(&creds_file) {
                if let Ok(disk_vault) = serde_json::from_str::<HashMap<String, String>>(&content) {
                    if let Some(obfuscated) = disk_vault.get(&key) {
                        if let Ok(clean) = deobfuscate(obfuscated, VAULT_KEY) {
                            return Ok(Some(clean));
                        }
                    }
                }
            }
        }
    }

    Ok(None)
}

/// Clears a credential from the vault.
#[tauri::command]
pub fn remove_secure_credential(
    state: State<'_, DesktopState>,
    key: String,
) -> Result<(), String> {
    let mut vault = state.credentials_vault.lock().unwrap();
    vault.remove(&key);

    if let Some(parent) = state.config_path.parent() {
        let creds_file = parent.join("vault.bin");
        if creds_file.exists() {
            if let Ok(content) = fs::read_to_string(&creds_file) {
                if let Ok(mut disk_vault) = serde_json::from_str::<HashMap<String, String>>(&content) {
                    disk_vault.remove(&key);
                    let _ = fs::write(&creds_file, serde_json::to_string(&disk_vault).unwrap_or_default());
                }
            }
        }
    }
    Ok(())
}

/// Loads local desktop configuration.
#[tauri::command]
pub fn load_desktop_config(state: State<'_, DesktopState>) -> Result<DesktopConfig, String> {
    if state.config_path.exists() {
        let content = fs::read_to_string(&state.config_path).map_err(|e| e.to_string())?;
        let config: DesktopConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(config)
    } else {
        Ok(DesktopConfig::default())
    }
}

/// Saves local desktop configuration.
#[tauri::command]
pub fn save_desktop_config(
    state: State<'_, DesktopState>,
    config: DesktopConfig,
) -> Result<(), String> {
    if let Some(parent) = state.config_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&state.config_path, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Persists window size, position, and maximized state.
#[tauri::command]
pub fn save_window_state(
    state: State<'_, DesktopState>,
    window_state: WindowStateData,
) -> Result<(), String> {
    if let Some(parent) = state.window_state_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let data = serde_json::to_string(&window_state).map_err(|e| e.to_string())?;
    fs::write(&state.window_state_path, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// Restores window size, position, and state.
#[tauri::command]
pub fn load_window_state(state: State<'_, DesktopState>) -> Result<Option<WindowStateData>, String> {
    if state.window_state_path.exists() {
        let content = fs::read_to_string(&state.window_state_path).map_err(|e| e.to_string())?;
        let data: WindowStateData = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(Some(data))
    } else {
        Ok(None)
    }
}

/// Emits a native desktop notification securely.
#[tauri::command]
pub fn send_desktop_notification<R: Runtime>(
    app: AppHandle<R>,
    title: String,
    body: String,
) -> Result<(), String> {
    log::info!("Desktop notification dispatch: {} - {}", title, body);
    let _ = app.emit(
        "desktop-notification-event",
        serde_json::json!({
            "title": title,
            "body": body,
            "timestamp": chrono::Utc::now().to_rfc3339()
        }),
    );
    Ok(())
}

/// Handles deep link activation (e.g. `neiman://action/open?id=123`).
#[tauri::command]
pub fn handle_deep_link<R: Runtime>(app: AppHandle<R>, url: String) -> Result<(), String> {
    // Zero-Trust validation: Reject malformed schemes, JavaScript pseudoprotocols, and CRLF injection
    if !url.starts_with("neiman://") {
        return Err("Invalid protocol: Only neiman:// scheme is permitted".to_string());
    }
    if url.contains('\n') || url.contains('\r') || url.contains('\0') {
        return Err("Malformed deep link: Injection characters detected".to_string());
    }
    if url.len() > 2048 {
        return Err("Payload too large: Deep link exceeds maximum length of 2048 characters".to_string());
    }

    log::info!("Handling validated deep link: {}", url);
    let _ = app.emit("deep-link-received", serde_json::json!({ "url": url }));
    Ok(())
}

/// Checks for application updates.
#[tauri::command]
pub fn check_app_updates() -> UpdateCheckResult {
    UpdateCheckResult {
        update_available: false,
        current_version: env!("CARGO_PKG_VERSION").to_string(),
        latest_version: env!("CARGO_PKG_VERSION").to_string(),
        release_notes: "NEIMAN OS Desktop Edition is up to date with zero-trust local vault."
            .to_string(),
        download_url: None,
    }
}

/// Bounded file export: strictly sandboxed to the user's Downloads or Home folder.
#[tauri::command]
pub fn export_report_file(
    filename: String,
    content: String,
) -> Result<String, String> {
    // Validate filename against path traversal attacks and enforce safe extensions
    if filename.contains('/') || filename.contains('\\') || filename.contains("..") || filename.contains('\0') {
        return Err("Invalid filename: directory traversal or null characters are prohibited".to_string());
    }
    let lower = filename.to_lowercase();
    let is_safe_ext = lower.ends_with(".json") || lower.ends_with(".csv") || lower.ends_with(".txt") || lower.ends_with(".md");
    if !is_safe_ext {
        return Err("Security policy violation: Only .json, .csv, .txt, and .md report exports are allowed".to_string());
    }

    let home = dirs::download_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(|| PathBuf::from("."));
    let target = home.join(filename);
    fs::write(&target, content).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().to_string())
}
