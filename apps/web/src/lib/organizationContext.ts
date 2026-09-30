'use client';

import { useAuthStore, type NexoraUser } from '@/store/auth';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { PREVIEW_COMPANY } from '@/lib/api/controlRoomPreview';

/** Resolve a read-only organization context for every protected page during local UI preview. */
export function useOrganizationContext() {
  const activeCompany = useAuthStore((state) => state.activeCompany);
  return isDevelopmentAuthBypassEnabled() ? PREVIEW_COMPANY : activeCompany;
}

export function useAccountContext(): { user: NexoraUser | null } {
  const user = useAuthStore((state) => state.user);
  return {
    user: user ?? (isDevelopmentAuthBypassEnabled() ? {
      id: 'preview-human-owner',
      email: 'alex@northstar.example',
      username: 'alex.morgan',
      first_name: 'Alex',
      last_name: 'Morgan',
      is_active: true,
      is_superuser: false,
      created_at: PREVIEW_COMPANY.created_at,
      updated_at: PREVIEW_COMPANY.updated_at,
    } : null),
  };
}
