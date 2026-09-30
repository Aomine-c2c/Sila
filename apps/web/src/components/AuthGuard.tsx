'use client';

/**
 * NEXORA Auth Guard
 * Redirects unauthenticated users to /auth/login.
 * Redirects authenticated users away from auth pages.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [hydrated, setHydrated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      const returnTo = encodeURIComponent(pathname || '/dashboard');
      router.replace(`/auth/login?next=${returnTo}`);
      return;
    }

    let active = true;
    setAuthorized(false);
    setCheckFailed(false);
    authApi.me().then((user) => {
      if (!active) return;
      setUser(user);
      setAuthorized(true);
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) {
        logout();
        const returnTo = encodeURIComponent(pathname || '/dashboard');
        router.replace(`/auth/login?next=${returnTo}`);
      } else {
        setCheckFailed(true);
      }
    });

    return () => {
      active = false;
    };
  }, [hydrated, token, pathname, router, setUser, logout, retry]);

  if (checkFailed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center" role="alert">
        <p className="text-sm text-muted-foreground">NEXORA could not verify your session.</p>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => {
            setCheckFailed(false);
            setRetry((count) => count + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hydrated || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="text-sm text-muted-foreground">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}
