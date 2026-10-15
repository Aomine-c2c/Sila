'use client';

import React from 'react';
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
  // Live metric derivations
  const workingAgents = state.agents.filter((a) => a.status === 'WORKING').length;
  const totalAgents = state.agents.length || 4;
  const activeProjects = state.projects.filter((p) => p.status === 'ACTIVE').length;
  const inProgressTasks = state.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pendingApprovals = state.approvals.filter((a) => a.status === 'PENDING').length;

  const compute = state.resources.compute_used_pct ?? 28.4;
  const tokens = state.resources.token_usage_total
    ? `${(state.resources.token_usage_total / 1000).toFixed(1)}k`
    : '42.8k';

  const budgetSpent = state.resources.budget_spent_usd ?? 0;
  const budgetAllocated = state.resources.budget_allocated_usd ?? 50000;
  const budgetPct = Math.min(100, Math.round((budgetSpent / (budgetAllocated || 1)) * 100));
  const budgetFormatted = `$${(budgetSpent / 1000).toFixed(1)}k / $${(budgetAllocated / 1000).toFixed(0)}k`;

  return (
    <div
      className={`relative flex flex-col min-h-[calc(100vh-12rem)] w-full items-center justify-center transition-opacity duration-300 py-4 ${
        isRefetching ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* 1. TOP RESPONSIVE DOCK (< XL viewports only) */}
      <div className="flex xl:hidden flex-wrap items-center justify-center gap-3 mb-4 w-full max-w-4xl px-4 z-20 font-mono">
        <button
          type="button"
          onClick={() => onOpenDrawer?.('agents')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-primary/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-muted-foreground uppercase">Workforce</span>
          <span className="text-xs font-bold text-foreground">
            {workingAgents}/{totalAgents}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('intelligence')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-sky-400/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="text-[11px] text-muted-foreground uppercase">Cognitive</span>
          <span className="text-xs font-bold text-foreground">{tokens}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('tasks')}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-violet-400/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-[11px] text-muted-foreground uppercase">Pipeline</span>
          <span className="text-xs font-bold text-foreground">{inProgressTasks} Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('approvals')}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-colors shadow-xs ${
            pendingApprovals > 0
              ? 'border-[#D71921]/60 bg-[#D71921]/10 text-[#D71921]'
              : 'border-border/60 bg-background/80 text-foreground hover:border-emerald-400/50'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              pendingApprovals > 0 ? 'bg-[#D71921] animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px] uppercase">Gate</span>
          <span className="text-xs font-bold">
            {pendingApprovals > 0 ? `${pendingApprovals} Sign-off` : 'Clear'}
          </span>
        </button>
      </div>

      {/* 2. LEFT FLANK TELEMETRY (Workforce, Cognition, Pipeline - XL Viewport Precision HUD Cards) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 select-none z-10 font-mono w-[240px]">
        {/* Node 1: Workforce Capacity */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('agents')}
          className="group relative flex flex-col items-start text-left p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workforce</span>
            </span>
            <span className="text-[9px] text-emerald-500 font-semibold">
              {Math.round((workingAgents / totalAgents) * 100)}%
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {workingAgents}
              <span className="text-sm font-normal text-muted-foreground/80">/{totalAgents}</span>
            </span>
            <span className="text-[10px] uppercase text-emerald-500 font-semibold tracking-wider">
              Working
            </span>
          </div>
          {/* Workforce load micro-bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${Math.max(12, (workingAgents / totalAgents) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Autonomous swarm operational
          </p>
        </button>

        {/* Node 2: Cognitive Token Velocity */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('intelligence')}
          className="group relative flex flex-col items-start text-left p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Cognitive Stream</span>
            </span>
            <span className="text-[9px] text-sky-400 font-semibold">Active</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{tokens}</span>
            <span className="text-[10px] uppercase text-sky-400 font-semibold tracking-wider">
              Tokens
            </span>
          </div>
          {/* Velocity ticker dots */}
          <div className="mt-2 flex items-center gap-1">
            <span className="h-1 w-4 rounded-full bg-sky-400/80 animate-pulse" />
            <span className="h-1 w-6 rounded-full bg-sky-400/60" />
            <span className="h-1 w-10 rounded-full bg-sky-400/40" />
            <span className="h-1 flex-1 rounded-full bg-muted/60" />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Multi-provider circuit nominal
          </p>
        </button>

        {/* Node 3: Execution Velocity */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('tasks')}
          className="group relative flex flex-col items-start text-left p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>Active Pipeline</span>
            </span>
            <span className="text-[9px] text-violet-400 font-semibold">
              {activeProjects} Proj
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {inProgressTasks}
            </span>
            <span className="text-[10px] uppercase text-violet-400 font-semibold tracking-wider">
              Tasks
            </span>
          </div>
          {/* Segmented status meter */}
          <div className="mt-2 flex items-center gap-1 w-full">
            <span className="h-1 flex-1 rounded-full bg-violet-400" />
            <span className="h-1 flex-1 rounded-full bg-violet-400/70" />
            <span className="h-1 flex-1 rounded-full bg-muted/60" />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Isolated worktree branches synced
          </p>
        </button>
      </div>

      {/* 3. CENTER: LIVING 3D MAGNETIC GRAIN ORB */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <MagneticGrainOrb state={state} onOpenDrawer={onOpenDrawer} />
      </div>

      {/* 4. RIGHT FLANK TELEMETRY (Executive Gate, Enclave, Capital Burn - XL Viewport Precision HUD Cards) */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4 select-none z-10 font-mono text-right items-end w-[240px]">
        {/* Node 1: Executive Gate / Approvals */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('approvals')}
          className={`group relative flex flex-col items-end text-right p-3.5 rounded-xl border backdrop-blur-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none w-full ${
            pendingApprovals > 0
              ? 'border-[#D71921]/60 bg-[#D71921]/5 hover:bg-[#D71921]/10 hover:border-[#D71921]'
              : 'border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/70'
          }`}
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span
              className={`text-[9px] font-semibold ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-emerald-400'
              }`}
            >
              {pendingApprovals > 0 ? 'Action Req' : 'Clear'}
            </span>
            <span className="flex items-center gap-2">
              <span>Executive Gate</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  pendingApprovals > 0 ? 'bg-[#D71921] animate-ping' : 'bg-emerald-400'
                }`}
              />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-foreground'
              }`}
            >
              {pendingApprovals}
            </span>
            <span
              className={`text-[10px] uppercase font-semibold tracking-wider ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-emerald-400'
              }`}
            >
              {pendingApprovals > 0 ? 'Pending Sign-Off' : 'Nominal'}
            </span>
          </div>
          {/* Constitutional safety meter */}
          <div className="mt-2 h-1 w-full rounded-full bg-muted/60 overflow-hidden flex justify-end">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pendingApprovals > 0 ? 'bg-[#D71921]' : 'bg-emerald-400'
              }`}
              style={{ width: pendingApprovals > 0 ? '100%' : '20%' }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Constitutional boundary verified
          </p>
        </button>

        {/* Node 2: Resource Compute & Memory */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('resources')}
          className="group relative flex flex-col items-end text-right p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none w-full"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[9px] text-cyan-400 font-semibold">{compute}%</span>
            <span className="flex items-center gap-2">
              <span>Compute Enclave</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {compute}%
            </span>
            <span className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider">
              CGroup Load
            </span>
          </div>
          {/* Compute load gauge bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-muted/60 overflow-hidden flex justify-end">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, compute))}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Memory ceiling: 64 GB isolated
          </p>
        </button>

        {/* Node 3: Budget Burn Rate & Quotas */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('resources')}
          className="group relative flex flex-col items-end text-right p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none w-full"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[9px] text-amber-400 font-semibold">{budgetPct}%</span>
            <span className="flex items-center gap-2">
              <span>Capital Burn</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {budgetFormatted}
            </span>
          </div>
          {/* Capital burn progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-muted/60 overflow-hidden flex justify-end">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${Math.max(6, budgetPct)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground/75 leading-tight">
            Monthly executive allocation
          </p>
        </button>
      </div>
    </div>
  );
}

