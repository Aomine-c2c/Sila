'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Attempt Next.js client router redirect
    router.replace('/dashboard');
    // Fallback: hard redirect after 1.2s
    const timer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] text-[#F5F5F5] font-mono text-xs select-none">
      <div className="rounded border border-border bg-[#0D0D0D] p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#D71921] shadow-[0_0_8px_#D71921]" />
            <span className="font-bold uppercase tracking-widest text-[11px]">NEIMAN OS (01)</span>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase">BOOTING</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <span className="animate-pulse text-[#D71921] font-bold">&gt;</span>
            <span>INITIALIZING COMMAND CENTER...</span>
          </div>
          <div className="w-full bg-secondary h-1 rounded-sm overflow-hidden">
            <div className="bg-[#D71921] h-full w-2/3 animate-pulse" />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[10px] border-t border-border/60">
          <a
            href="/dashboard"
            className="text-foreground hover:text-[#D71921] transition-colors uppercase font-bold"
          >
            OPEN DASHBOARD &rarr;
          </a>
          <a
            href="/auth/login"
            className="text-muted-foreground hover:text-foreground transition-colors uppercase"
          >
            SIGN IN
          </a>
        </div>
      </div>
    </div>
  );
}