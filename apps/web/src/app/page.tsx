'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Attempt Next.js client router redirect
    router.replace('/dashboard');
    // Fallback: if client router does not transition within 1.5s, hard redirect
    const timer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground font-mono text-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
        <span>Entering NEIMAN Command Center...</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <a
          href="/dashboard"
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          Go directly to Dashboard &rarr;
        </a>
        <span className="text-muted-foreground">|</span>
        <a
          href="/auth/login"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </a>
      </div>
    </div>
  );
}