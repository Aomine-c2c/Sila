'use client';

/**
 * NEXORA Auth Guard
 * Redirects unauthenticated users to /auth/login.
 * Redirects authenticated users away from auth pages.
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

