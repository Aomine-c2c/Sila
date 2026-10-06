//! NEIMAN Desktop — Autonomous Organization OS Native Runtime
//!
//! Exposes strictly bounded capabilities:
//! - System tray with quick actions and live state indicator
//! - Native desktop notifications
//! - Encrypted/secure credential storage (memory-guarded with local obfuscation)
//! - Window state persistence (position, size, maximized state across reboots)
//! - Secure local desktop configuration
//! - Bounded file export/import (strictly sandboxed to user-selected files)
//! - Deep link handler (neiman://)
//! - Degraded/offline network state synchronization
//! - Update check architecture

pub mod commands;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, Manager,
};

// =========================================================================
// DATA MODELS & STATE
// =========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowStateData {
    pub width: f64,
    pub height: f64,
    pub x: f64,
    pub y: f64,
    pub is_maximized: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesktopConfig {
    pub api_endpoint: String,
    pub theme: String,
    pub launch_at_startup: bool,
    pub minimize_to_tray: bool,
    pub notifications_enabled: bool,
    pub offline_cache_enabled: bool,
    pub telemetry_consent: bool,
}

impl Default for DesktopConfig {
    fn default() -> Self {
        Self {
            api_endpoint: "http://localhost:8000".to_string(),
            theme: "dark".to_string(),
            launch_at_startup: false,
            minimize_to_tray: true,
            notifications_enabled: true,
            offline_cache_enabled: true,
            telemetry_consent: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub update_available: bool,
    pub current_version: String,
    pub latest_version: String,
    pub release_notes: String,
    pub download_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemTelemetrySnapshot {
    pub os: String,
    pub arch: String,
    pub app_version: String,
    pub memory_rss_mb: u64,
    pub is_desktop: bool,
}

pub struct DesktopState {
    pub credentials_vault: Mutex<HashMap<String, String>>,
    pub config_path: PathBuf,
    pub window_state_path: PathBuf,
}

// Simple deterministic XOR cipher for local credential obfuscation
pub fn obfuscate(input: &str, key: &[u8]) -> String {
    let bytes = input.as_bytes();
    let xor_bytes: Vec<u8> = bytes
        .iter()
        .enumerate()
        .map(|(i, &b)| b ^ key[i % key.len()])
        .collect();
    hex::encode(xor_bytes)
}

pub fn deobfuscate(hex_input: &str, key: &[u8]) -> Result<String, String> {
    let bytes = hex::decode(hex_input).map_err(|e| e.to_string())?;
    let orig_bytes: Vec<u8> = bytes
        .iter()
        .enumerate()
        .map(|(i, &b)| b ^ key[i % key.len()])
        .collect();
    String::from_utf8(orig_bytes).map_err(|e| e.to_string())
}

pub const VAULT_KEY: &[u8] = b"NEIMAN_ZERO_TRUST_DESKTOP_SEC_2026";

// =========================================================================
// RUNTIME SETUP WITH SYSTEM TRAY & CAPABILITIES
// =========================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_dir = dirs::config_dir()
        .map(|p| p.join("neiman-desktop"))
        .unwrap_or_else(|| PathBuf::from("./.neiman-desktop"));

    let config_path = config_dir.join("config.json");
    let window_state_path = config_dir.join("window_state.json");

    let desktop_state = DesktopState {
        credentials_vault: Mutex::new(HashMap::new()),
        config_path,
        window_state_path,
    };

    tauri::Builder::default()
        .manage(desktop_state)
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register official Tauri v2 auto-updater plugin
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;

            // 1. Build System Tray Menu
            let toggle_item = MenuItem::with_id(app, "toggle", "Open NEIMAN OS", true, None::<&str>)?;
            let activity_item = MenuItem::with_id(app, "activity", "Live Activity Stream", true, None::<&str>)?;
            let simulation_item = MenuItem::with_id(app, "simulation", "Simulation Lab", true, None::<&str>)?;
            let status_item = MenuItem::with_id(app, "status", "Status: Online (Active)", false, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit NEIMAN", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &toggle_item,
                    &activity_item,
                    &simulation_item,
                    &status_item,
                    &quit_item,
                ],
            )?;

            // 2. Load Tray Icon
            let icon_bytes = include_bytes!("../icons/32x32.png");
            let tray_icon = Image::from_bytes(icon_bytes).map_err(|e| {
                tauri::Error::AssetNotFound(format!("Failed to load tray icon: {}", e))
            })?;

            // 3. Register System Tray
            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .tooltip("NEIMAN — Autonomous Organization OS")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "activity" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.location.href = '/dashboard/activity'");
                        }
                    }
                    "simulation" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.location.href = '/dashboard/simulation'");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_desktop_telemetry,
            commands::set_secure_credential,
            commands::get_secure_credential,
            commands::remove_secure_credential,
            commands::load_desktop_config,
            commands::save_desktop_config,
            commands::save_window_state,
            commands::load_window_state,
            commands::send_desktop_notification,
            commands::handle_deep_link,
            commands::check_app_updates,
            commands::export_report_file,
            commands::inspect_local_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
