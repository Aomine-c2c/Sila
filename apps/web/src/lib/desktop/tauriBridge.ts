/**
 * NEIMAN Desktop Native Bridge
 *
 * Provides a unified API surface that seamlessly toggles between:
 * 1. Tauri Native Runtime (System Tray, Encrypted Vault, Window State Persistence, Deep Links, Native Notifications, Sandbox File Export)
 * 2. Standard Web Browser Environment (Graceful Web Fallbacks: LocalStorage, Web Notifications, Web Blob Downloads)
 *
 * Strictly adheres to zero-trust principles: Never assumes raw shell or unrestricted fs access.
 */

import { isValidDeepLink, isSafeExportFilename } from '@neiman/validation';
import { NEIMAN_CONFIG } from '@neiman/config';

export interface SystemTelemetrySnapshot {
  os: string;
  arch: string;
  app_version: string;
  memory_rss_mb: number;
  is_desktop: boolean;
}

export interface DesktopConfig {
  api_endpoint: string;
  theme: string;
  launch_at_startup: boolean;
  minimize_to_tray: boolean;
  notifications_enabled: boolean;
  offline_cache_enabled: boolean;
  telemetry_consent: boolean;
}

export interface WindowStateData {
  width: number;
  height: number;
  x: number;
  y: number;
  is_maximized: boolean;
}

export interface UpdateCheckResult {
  update_available: boolean;
  current_version: string;
  latest_version: string;
  release_notes: string;
  download_url?: string | null;
}

/**
 * Checks if running inside the native Tauri container
 */
export function isTauriDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
    (window as unknown as { __TAURI__?: unknown }).__TAURI__
  );
}

// Dynamically invoke Tauri core IPC
async function invokeTauri<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

// =========================================================================
// 1. SECURE CREDENTIAL VAULT (Native Memory/Obfuscated Disk vs In-Memory/Storage)
// =========================================================================
export const desktopVault = {
  async setCredential(key: string, value: string): Promise<void> {
    if (isTauriDesktop()) {
      await invokeTauri('set_secure_credential', { key, value });
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`neiman_sec_${key}`, btoa(value));
      }
    }
  },

  async getCredential(key: string): Promise<string | null> {
    if (isTauriDesktop()) {
      return await invokeTauri<string | null>('get_secure_credential', { key });
    } else {
      if (typeof window === 'undefined') return null;
      const val = sessionStorage.getItem(`neiman_sec_${key}`);
      return val ? atob(val) : null;
    }
  },

  async removeCredential(key: string): Promise<void> {
    if (isTauriDesktop()) {
      await invokeTauri('remove_secure_credential', { key });
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`neiman_sec_${key}`);
      }
    }
  }
};

// =========================================================================
// 2. DESKTOP LOCAL CONFIGURATION
// =========================================================================
export const desktopConfig = {
  async load(): Promise<DesktopConfig> {
    if (isTauriDesktop()) {
      return await invokeTauri<DesktopConfig>('load_desktop_config');
    }
    return {
      api_endpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      theme: 'dark',
      launch_at_startup: false,
      minimize_to_tray: true,
      notifications_enabled: true,
      offline_cache_enabled: true,
      telemetry_consent: false,
    };
  },

  async save(config: DesktopConfig): Promise<void> {
    if (isTauriDesktop()) {
      await invokeTauri('save_desktop_config', { config });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('neiman_desktop_cfg', JSON.stringify(config));
      }
    }
  }
};

// =========================================================================
// 3. WINDOW STATE PERSISTENCE
// =========================================================================
export const desktopWindowState = {
  async save(state: WindowStateData): Promise<void> {
    if (isTauriDesktop()) {
      await invokeTauri('save_window_state', { windowState: state });
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('neiman_win_state', JSON.stringify(state));
      }
    }
  },

  async load(): Promise<WindowStateData | null> {
    if (isTauriDesktop()) {
      return await invokeTauri<WindowStateData | null>('load_window_state');
    }
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('neiman_win_state');
    return raw ? JSON.parse(raw) : null;
  }
};

// =========================================================================
// 4. DESKTOP NOTIFICATIONS (Cross-Platform Native & Browser fallback)
// =========================================================================
export const desktopNotify = {
  async send(title: string, body: string): Promise<void> {
    if (isTauriDesktop()) {
      await invokeTauri('send_desktop_notification', { title, body });
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      }
    }
  }
};

// =========================================================================
// 5. UPDATE ARCHITECTURE
// =========================================================================
export const desktopUpdates = {
  async checkForUpdates(): Promise<UpdateCheckResult> {
    if (isTauriDesktop()) {
      return await invokeTauri<UpdateCheckResult>('check_app_updates');
    }
    return {
      update_available: false,
      current_version: '0.1.0-web',
      latest_version: '0.1.0-web',
      release_notes: 'Web edition running latest production bundle.',
      download_url: null,
    };
  }
};

// =========================================================================
// 6. SECURE SANDBOX FILE EXPORT
// =========================================================================
export const desktopExport = {
  async exportReport(filename: string, content: string): Promise<string> {
    if (!isSafeExportFilename(filename)) {
      throw new Error('Security policy violation: Only .json, .csv, .txt, and .md report exports are allowed');
    }
    if (isTauriDesktop()) {
      return await invokeTauri<string>('export_report_file', { filename, content });
    } else {
      // Browser File Blob Download fallback
      if (typeof window !== 'undefined') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return `Downloaded via browser: ${filename}`;
      }
      return 'Export triggered';
    }
  }
};

// =========================================================================
// 7. DEEP LINKING & EVENTS
// =========================================================================
export const desktopEvents = {
  async listenDeepLink(handler: (url: string) => void): Promise<() => void> {
    if (isTauriDesktop()) {
      const { listen } = await import('@tauri-apps/api/event');
      const unlisten = await listen<{ url: string }>('deep-link-received', (event) => {
        if (isValidDeepLink(event.payload.url)) {
          handler(event.payload.url);
        } else {
          console.warn('Blocked invalid deep link payload:', event.payload.url);
        }
      });
      return unlisten;
    }
    return () => {};
  }
};

// =========================================================================
// 8. TELEMETRY & SYSTEM CAPABILITIES
// =========================================================================
export const desktopTelemetry = {
  async getSnapshot(): Promise<SystemTelemetrySnapshot> {
    if (isTauriDesktop()) {
      return await invokeTauri<SystemTelemetrySnapshot>('get_desktop_telemetry');
    }
    return {
      os: typeof navigator !== 'undefined' ? (navigator.platform || 'WebBrowser') : 'Server',
      arch: 'web',
      app_version: '0.1.0-web',
      memory_rss_mb: 42,
      is_desktop: false,
    };
  }
};
