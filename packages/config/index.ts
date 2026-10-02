/**
 * NEIMAN Universal Configuration & Defaults
 * Shared across Web, Desktop, and TUI.
 */

export const NEIMAN_CONFIG = {
  APP_NAME: 'NEIMAN',
  APP_FULL_NAME: 'NEIMAN Autonomous Organization OS',
  APP_VERSION: '0.1.0',
  DEFAULT_API_URL: 'http://localhost:8000',
  DEFAULT_WS_URL: 'ws://localhost:8000',
  AUTH_STORAGE_KEY: 'NEIMAN-auth',
  QUERY_CACHE_TTL_MS: 4000,
  MAX_VISIBLE_STREAM_EVENTS: 30,
  ORG_GRAPH_VIRTUALIZATION_LIMIT: 30,
  ZERO_TRUST_DEEP_LINK_SCHEME: 'neiman://',
} as const;

export function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NEIMAN_API_URL) {
    return process.env.NEIMAN_API_URL;
  }
  return NEIMAN_CONFIG.DEFAULT_API_URL;
}

export function getWsBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (typeof process !== 'undefined' && process.env?.NEIMAN_WS_URL) {
    return process.env.NEIMAN_WS_URL;
  }
  return NEIMAN_CONFIG.DEFAULT_WS_URL;
}
