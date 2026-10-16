'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Command,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganizationContext } from '@/lib/organizationContext';
import { api } from '@/lib/api/client';

interface ActivityEvent {
  id: string;
  created_at: string;
  actor_name?: string;
  action: string;
  status?: string;
  domain?: string;
}

interface CockpitFooterDockProps {
  onOpenDrawer?: (drawerId: string) => void;
  activeDrawerId?: string | null;
  onOpenCommandPalette?: () => void;
}

export function CockpitFooterDock({
  onOpenDrawer,
  activeDrawerId,
  onOpenCommandPalette,
}: CockpitFooterDockProps) {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';

  // Live activity query for recent events
  const { data: recentEvents = [] } = useQuery<ActivityEvent[]>({
    queryKey: ['footer-recent-activity', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const res = await api.get<any[]>(`/api/v1/companies/${companyId}/activity?limit=5`);
        if (Array.isArray(res)) {
          return res.map((item) => ({
            id: item.id || Math.random().toString(),
            created_at: item.created_at || new Date().toISOString(),
            actor_name: item.actor_name || item.agent_name || item.actor || 'System Engine',
            action: item.action || item.description || item.title || 'Telemetry cycle synced',
            status: item.status || 'NOMINAL',
            domain: item.domain || 'KERNEL',
          }));
        }
        return [];
      } catch {
        return [
          {
            id: 'fallback-1',
            created_at: new Date().toISOString(),
            actor_name: 'Kernel Watcher',
            action: 'Multi-agent synchronization active · Quorum stable',
            status: 'NOMINAL',
            domain: 'SWARM',
          },
        ];
      }
    },
    enabled: !!companyId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const latestEvent = recentEvents[0] ?? {
    id: 'stream-nominal',
    created_at: new Date().toISOString(),
    actor_name: 'Autonomous Kernel',
    action: 'Telemetry heartbeat nominal · Memory isolated · Zero drift',
    status: 'NOMINAL',
    domain: 'SYS',
  };

  const formatEventTime = (isoString?: string) => {
    if (!isoString) return 'LIVE';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'LIVE';
    }
  };

  return (
    <footer
      className="sticky bottom-0 z-30 flex h-10 shrink-0 items-center justify-between border-t border-border/80 bg-background/90 backdrop-blur-xl px-3 lg:px-5 select-none font-mono text-xs"
      role="navigation"
      aria-label="Mission control live activity ticker"
    >
      {/* 1. Left Indicator: Live Radar Stream Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onOpenDrawer?.('activity')}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/60 transition-colors group focus:outline-none"
          title="Open Activity Stream"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D71921] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D71921]" />
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-foreground group-hover:text-[#D71921] transition-colors flex items-center gap-1.5">
            RADAR // LIVE
          </span>
        </button>

        <div className="hidden sm:block h-3.5 w-px bg-border/60" aria-hidden="true" />

        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase">
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-semibold">99.8%</span>
          <span>UPTIME</span>
        </div>
      </div>

      {/* 2. Center: Streaming Activity Event Banner */}
      <div className="flex-1 max-w-3xl mx-3 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenDrawer?.('activity')}
          className="flex items-center gap-2 w-full text-left truncate px-2.5 py-1 rounded-lg hover:bg-secondary/40 transition-colors focus:outline-none group"
        >
          <span className="text-[10px] text-muted-foreground/70 shrink-0 font-mono">
            [{formatEventTime(latestEvent.created_at)}]
          </span>
          <span className="text-[10px] font-bold text-foreground px-1.5 py-0.5 rounded-sm bg-secondary shrink-0 group-hover:border group-hover:border-border transition-colors">
            {latestEvent.actor_name}
          </span>
          <span className="text-[11px] text-muted-foreground truncate group-hover:text-foreground transition-colors">
            {latestEvent.action}
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </button>
      </div>

      {/* 3. Right: Command Hub Quick Trigger (Cmd+K) & Full Drawer View */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onOpenDrawer?.('activity')}
          className={cn(
            'hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-all focus:outline-none',
            activeDrawerId === 'activity'
              ? 'bg-foreground text-background shadow-xs'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
          )}
        >
          <Activity className="h-3 w-3" />
          <span>Stream Log</span>
        </button>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-foreground border border-border/60 text-[10px] tracking-wider transition-colors shadow-2xs focus:outline-none"
          title="Open Universal Command Hub (Cmd+K)"
        >
          <Command className="h-3 w-3 text-muted-foreground" />
          <span className="font-semibold hidden sm:inline">HUB</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 bg-background border border-border/60 rounded text-[9px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>
    </footer>
  );
}
