'use client';

import type { ControlRoomState } from '@/lib/api/controlRoom';
import type { ActivityConnection, ActivityTransport } from '@/hooks/useActivityStream';
import { MagneticGrainOrb } from '@/components/layout/MagneticGrainOrb';

interface ControlRoomDashboardProps {
  companyName: string;
  companyStatus?: string;
  industry?: string | null;
  state: ControlRoomState;
  live: {
    connection: ActivityConnection;
    transport: ActivityTransport;
    freshIds: Set<string>;
  };
  isRefetching?: boolean;
  previewMode?: boolean;
  onDecideApproval?: (approvalId: string, decision: 'APPROVED' | 'REJECTED') => void;
  onOpenDrawer?: (drawerId: string) => void;
}

export function ControlRoomDashboard({
  state,
  isRefetching,
  onOpenDrawer,
}: ControlRoomDashboardProps) {
  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefetching ? 'opacity-80' : 'opacity-100'}`}>
      {/* Centered Magnetic Grain Orb & Orbital Command Constellation */}
      <section
        aria-label="Magnetic Grain Core Constellation"
        className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-b from-card/60 via-card/30 to-background/80 backdrop-blur-xl p-4 sm:p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-2 font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#D71921] animate-ping" />
            <span className="font-bold uppercase tracking-wider text-foreground">
              CORE ORGANIC PICTURE // MAGNETIC GRAIN CONSTELLATION
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] text-muted-foreground">
              {state.agents.length} AGENTS · {state.projects.length} PROJECTS
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Nominal Orbit</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D71921]" />
              <span>Executive Attention</span>
            </span>
          </div>
        </div>

        <MagneticGrainOrb onOpenDrawer={onOpenDrawer} />
      </section>
    </div>
  );
}
