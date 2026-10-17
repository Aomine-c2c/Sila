'use client';

import React from 'react';
import { Check, X, ShieldAlert, Cpu, Activity, Zap, Play, Terminal } from 'lucide-react';
import type { ControlRoomState } from '@/lib/api/controlRoom';
import type { ActivityConnection, ActivityTransport } from '@/hooks/useActivityStream';
import { MagneticGrainOrb } from '@/components/layout/MagneticGrainOrb';
import { AgentExecutionTable } from '@/components/control-room/AgentExecutionTable';
import { TaskPipelineMatrix } from '@/components/control-room/TaskPipelineMatrix';
import { IntelligenceGatewayMatrix } from '@/components/control-room/IntelligenceGatewayMatrix';
import { KnowledgeGraphStream } from '@/components/control-room/KnowledgeGraphStream';
import { LowerTelemetryWaterfall } from '@/components/control-room/LowerTelemetryWaterfall';

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
  onDecideApproval,
  onOpenDrawer,
}: ControlRoomDashboardProps) {
  // Live metric derivations
  const workingAgents = state.agents.filter((a) => a.status === 'WORKING' || a.status === 'ACTIVE').length;
  const totalAgents = state.agents.length || 4;
  const inProgressTasks = state.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const totalTasks = state.tasks.length || 6;
  const pendingApprovalsList = state.approvals.filter((a) => a.status === 'PENDING');
  const pendingApprovals = pendingApprovalsList.length;

  const compute = state.resources.compute_used_pct ?? 28.4;
  const tokens = state.resources.token_usage_total
    ? `${(state.resources.token_usage_total / 1000).toFixed(1)}k`
    : '42.8k';

  const budgetSpent = state.resources.budget_spent_usd ?? 0;
  const budgetAllocated = state.resources.budget_allocated_usd ?? 50000;
  const budgetPct = Math.min(100, Math.round((budgetSpent / (budgetAllocated || 1)) * 100));
  const budgetFormatted = `$${(budgetSpent / 1000).toFixed(1)}k / $${(budgetAllocated / 1000).toFixed(0)}k`;

  const firstApproval = pendingApprovalsList[0];

  return (
    <div
      className={`flex flex-col h-full w-full justify-between gap-2.5 p-1 font-mono select-none overflow-hidden transition-opacity duration-150 ${
        isRefetching ? 'opacity-85' : 'opacity-100'
      }`}
    >
      {/* 1. TOP TACTICAL DECK: BORDERLESS KPI METRICS FLANKING FLOATING 3D ORB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center shrink-0 border-b border-border/30 pb-1 px-1">
        {/* Left Pair KPIs (col 1 to 4) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* KPI 1: Workforce Capacity */}
          <button
            type="button"
            onClick={() => onOpenDrawer?.('agents')}
            className="flex flex-col justify-between p-2 rounded transition-colors text-left hover:bg-secondary/30 focus:outline-none group"
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Workforce</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground font-mono">{workingAgents}</span>
              <span className="text-xs text-muted-foreground font-mono">/{totalAgents} Working</span>
            </div>
            <div className="h-0.5 w-full bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(workingAgents / totalAgents) * 100}%` }}
              />
            </div>
          </button>

          {/* KPI 2: Cognitive Token Velocity */}
          <button
            type="button"
            onClick={() => onOpenDrawer?.('intelligence')}
            className="flex flex-col justify-between p-2 rounded transition-colors text-left hover:bg-secondary/30 focus:outline-none group"
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Cognitive Stream</span>
              <Zap className="h-3 w-3 text-sky-500" />
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground font-mono">{tokens}</span>
              <span className="text-xs text-muted-foreground font-mono">Tokens</span>
            </div>
            <div className="text-[9px] text-muted-foreground truncate">
              Multi-provider nominal
            </div>
          </button>
        </div>

        {/* Center: PURE KINETIC 3D ACCRETION ORB - NO BOX, NO BORDERS, NO CONTAINER (col 5 to 8) */}
        <div className="lg:col-span-4 flex items-center justify-center relative overflow-visible py-0">
          <MagneticGrainOrb state={state} onOpenDrawer={onOpenDrawer} compact={true} />
        </div>

        {/* Right Pair KPIs (col 9 to 12) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* KPI 3: Executive Gate Sign-Offs */}
          <button
            type="button"
            onClick={() => onOpenDrawer?.('approvals')}
            className={`flex flex-col justify-between p-2 rounded text-left focus:outline-none transition-colors hover:bg-secondary/30 ${
              pendingApprovals > 0 ? 'bg-[#D71921]/5 text-[#D71921]' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className={pendingApprovals > 0 ? 'text-[#D71921] font-bold' : 'text-muted-foreground'}>
                Executive Gate
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  pendingApprovals > 0 ? 'bg-[#D71921] animate-ping' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold font-mono ${pendingApprovals > 0 ? 'text-[#D71921]' : 'text-foreground'}`}>
                {pendingApprovals}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {pendingApprovals > 0 ? 'Action Req' : 'Clear'}
              </span>
            </div>
            {firstApproval && onDecideApproval ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecideApproval(firstApproval.id, 'APPROVED');
                  }}
                  className="px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold hover:bg-emerald-500/20"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecideApproval(firstApproval.id, 'REJECTED');
                  }}
                  className="px-2 py-0.5 rounded border border-[#D71921]/40 bg-[#D71921]/10 text-[#D71921] text-[9px] font-bold hover:bg-[#D71921]/20"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-[9px] text-muted-foreground truncate">
                Boundary nominal
              </div>
            )}
          </button>

          {/* KPI 4: Compute & Capital Burn */}
          <button
            type="button"
            onClick={() => onOpenDrawer?.('resources')}
            className="flex flex-col justify-between p-2 rounded transition-colors text-left hover:bg-secondary/30 focus:outline-none"
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
              <span>Enclave Compute</span>
              <span className="text-[9px] font-bold text-foreground font-mono">{compute}%</span>
            </div>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-foreground font-mono truncate">{budgetFormatted}</span>
            </div>
            <div className="text-[9px] text-muted-foreground flex justify-between font-mono">
              <span>CGroup {compute}%</span>
              <span>Burn {budgetPct}%</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. CENTER OPERATIONS DECK: 4-QUADRANT CONTAINERLESS HIGH-DENSITY MISSION CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-3 flex-1 min-h-0 overflow-hidden pt-1">
        {/* Quadrant 1: Live Agent Execution Table */}
        <AgentExecutionTable agents={state.agents} onOpenDrawer={onOpenDrawer} />

        {/* Quadrant 2: Task Pipeline & Projects Matrix */}
        <TaskPipelineMatrix tasks={state.tasks} projects={state.projects} onOpenDrawer={onOpenDrawer} />

        {/* Quadrant 3: Intelligence Gateway & Resiliency Circuits */}
        <IntelligenceGatewayMatrix resources={state.resources} onOpenDrawer={onOpenDrawer} />

        {/* Quadrant 4: Organizational Memory & Knowledge Graph Stream */}
        <KnowledgeGraphStream onOpenDrawer={onOpenDrawer} />
      </div>

      {/* 3. DOCKED LOWER TELEMETRY WATERFALL ROW */}
      <div className="w-full flex justify-center pb-0.5 pt-0.5 z-20 shrink-0">
        <LowerTelemetryWaterfall
          activity={state.activity}
          onOpenDrawer={onOpenDrawer}
        />
      </div>
    </div>
  );
}
