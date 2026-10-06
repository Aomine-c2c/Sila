'use client';

import React, { useEffect, useState } from 'react';
import { RotateCw, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { desktopUpdates, isTauriDesktop, UpdateCheckResult } from '@/lib/desktop/tauriBridge';

export function UpdateReadyModal() {
  const [updateReady, setUpdateReady] = useState<UpdateCheckResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    // Only perform silent background checks on native desktop or enabled clients
    let mounted = true;

    async function checkForSilentUpdate() {
      try {
        const update = await desktopUpdates.checkForUpdates();
        if (update && update.update_available && mounted) {
          // Trigger silent background download immediately without prompt
          const success = await desktopUpdates.downloadAndInstall((pct) => {
            if (mounted) setDownloadProgress(pct);
          });
          if (success && mounted) {
            // Once download & install stage is complete, prompt operator to restart
            setUpdateReady(update);
          }
        }
      } catch (err) {
        console.debug('Background update check bypassed:', err);
      }
    }

    // Delay check slightly so boot / initial dashboard render completes first
    const timer = setTimeout(() => {
      checkForSilentUpdate();
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!updateReady) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fade-in font-mono"
    >
      <div className="bg-[#080808] border border-[#D71921]/60 shadow-[0_0_24px_rgba(215,25,33,0.18)] p-4 space-y-3 relative text-foreground">
        {/* Header Indicator */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#D71921] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D71921]">
              SYS.RELEASE / UPDATE READY
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted/20 px-1 py-0.5 border border-border/40">
            v{updateReady.latest_version}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground tracking-tight">
            New update downloaded in background.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {updateReady.release_notes || 'Performance enhancements, security hardening, and Nothing UI polish.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/30">
          <button
            type="button"
            onClick={() => setUpdateReady(null)}
            className="px-3 py-1.5 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            disabled={isApplying}
            onClick={async () => {
              setIsApplying(true);
              await desktopUpdates.restartToApply();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D71921] hover:bg-[#b0131a] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <RotateCw className="h-3 w-3 animate-spin" />
                <span>Restarting...</span>
              </>
            ) : (
              <>
                <span>Restart Now</span>
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
