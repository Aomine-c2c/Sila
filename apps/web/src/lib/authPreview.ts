/**
 * Local UI work can opt out of the login screen while using next dev.
 * NODE_ENV is part of the production bundle, so this cannot enable in a build.
 */
export function isDevelopmentAuthBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_NEXORA_DEV_AUTH_BYPASS === 'true';
}
