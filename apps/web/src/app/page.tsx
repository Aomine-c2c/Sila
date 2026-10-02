'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-NEIMAN-dark text-muted-foreground font-mono text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
        <span>Entering NEIMAN Command Center...</span>
      </div>
    </div>
  );
}