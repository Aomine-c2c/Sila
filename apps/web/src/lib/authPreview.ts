/**
 * Local UI and workstation installations opt out of the login screen.
 * Enabled whenever NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS is set to 'true'.
 */
export function isDevelopmentAuthBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NEIMAN_DEV_AUTH_BYPASS === 'true';
}
