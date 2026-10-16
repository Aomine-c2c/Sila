'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { ControlRoomState } from '@/lib/api/controlRoom';
import type { ActivityConnection, ActivityTransport } from '@/hooks/useActivityStream';
import { MagneticGrainOrb } from '@/components/layout/MagneticGrainOrb';
import { AgentAvatar } from '@/components/ui/AgentAvatar';

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
  const [pipelineTab, setPipelineTab] = useState<'TASKS' | 'PROJECTS'>('TASKS');

  // Live metric derivations
  const workingAgents = state.agents.filter((a) => a.status === 'WORKING' || a.status === 'ACTIVE').length;
  const totalAgents = state.agents.length || 4;
  const inProgressTasks = state.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const totalTasks = state.tasks.length || 6;
  const activeProjects = state.projects.filter((p) => p.status === 'ACTIVE').length;
  const totalProjects = state.projects.length || 2;
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

  // First pending approval for quick 1-click action
  const firstApproval = pendingApprovalsList[0];

  return (
    <div
      className={`relative flex flex-col h-full w-full items-center justify-center transition-opacity duration-300 ${
        isRefetching ? 'opacity-80' : 'opacity-100'
      }`}
    >
      {/* 1. TOP RESPONSIVE DOCK (< XL viewports only) */}
      <div className="flex xl:hidden flex-wrap items-center justify-center gap-2 mb-2 w-full max-w-4xl px-2 z-20 font-mono">
        <button
          type="button"
          onClick={() => onOpenDrawer?.('agents')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-primary/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase">Workforce</span>
          <span className="text-xs font-bold text-foreground">
            {workingAgents}/{totalAgents}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('intelligence')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-sky-400/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="text-[10px] text-muted-foreground uppercase">Cognitive</span>
          <span className="text-xs font-bold text-foreground">{tokens}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('tasks')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-border/60 bg-background/80 backdrop-blur-md hover:border-violet-400/50 transition-colors shadow-xs"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-[10px] text-muted-foreground uppercase">Pipeline</span>
          <span className="text-xs font-bold text-foreground">{inProgressTasks} Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('approvals')}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border backdrop-blur-md transition-colors shadow-xs ${
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
          <span className="text-[10px] uppercase">Gate</span>
          <span className="text-xs font-bold">
            {pendingApprovals > 0 ? `${pendingApprovals} Sign-off` : 'Clear'}
          </span>
        </button>
      </div>

      {/* 2. LEFT FLANK TELEMETRY (Workforce & Segmented Pipeline - XL Viewport Precision HUD Cards) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 select-none z-10 font-mono w-[230px]">
        {/* Node 1: Workforce Capacity with Active Agent Avatars */}
        <div className="flex flex-col items-start text-left p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 transition-all shadow-xs">
          <button
            type="button"
            onClick={() => onOpenDrawer?.('agents')}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors group focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workforce</span>
            </span>
            <span className="text-[9px] text-emerald-500 font-semibold group-hover:underline">
              {Math.round((workingAgents / totalAgents) * 100)}%
            </span>
          </button>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {workingAgents}
              <span className="text-xs font-normal text-muted-foreground/80">/{totalAgents}</span>
            </span>
            <span className="text-[9px] uppercase text-emerald-500 font-semibold tracking-wider">
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
          {/* Active Agents Mini Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 w-full flex-wrap">
            {state.agents.slice(0, 3).map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => onOpenDrawer?.('agents')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/80 border border-border/40 hover:border-primary/50 text-[10px] text-foreground transition-colors"
                title={`${agent.name} (${agent.autonomy || 'Autonomous'})`}
              >
                <AgentAvatar
                  name={agent.name}
                  status={agent.status}
                  avatarUrl={agent.identity?.avatar_url as string | undefined}
                  size={16}
                  showStatus={false}
                />
                <span className="truncate max-w-[60px] font-medium">{agent.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Node 2: Cognitive Token Velocity */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('intelligence')}
          className="group relative flex flex-col items-start text-left p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 transition-all focus:outline-none shadow-xs"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Cognitive Stream</span>
            </span>
            <span className="text-[9px] text-sky-400 font-semibold">Active</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">{tokens}</span>
            <span className="text-[9px] uppercase text-sky-400 font-semibold tracking-wider">
              Tokens
            </span>
          </div>
          {/* Velocity ticker dots */}
          <div className="mt-2 flex items-center gap-1 w-full">
            <span className="h-1 w-3 rounded-full bg-sky-400/80 animate-pulse" />
            <span className="h-1 w-5 rounded-full bg-sky-400/60" />
            <span className="h-1 w-8 rounded-full bg-sky-400/40" />
            <span className="h-1 flex-1 rounded-full bg-muted/60" />
          </div>
          <p className="mt-1 text-[9px] text-muted-foreground/75 leading-tight">
            Multi-provider circuit nominal
          </p>
        </button>

        {/* Node 3: Segmented Pipeline (Tasks vs Projects) */}
        <div className="flex flex-col items-start text-left p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 transition-all shadow-xs">
          <div className="flex items-center justify-between w-full mb-1">
            {/* Segment Switcher */}
            <div className="flex items-center rounded-lg bg-secondary/80 p-0.5 border border-border/60 text-[9px]">
              <button
                type="button"
                onClick={() => setPipelineTab('TASKS')}
                className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                  pipelineTab === 'TASKS'
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                TASKS
              </button>
              <button
                type="button"
                onClick={() => setPipelineTab('PROJECTS')}
                className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                  pipelineTab === 'PROJECTS'
                    ? 'bg-foreground text-background shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PROJECTS
              </button>
            </div>

            <button
              type="button"
              onClick={() => onOpenDrawer?.(pipelineTab === 'TASKS' ? 'tasks' : 'projects')}
              className="text-[9px] text-violet-400 font-semibold hover:underline"
            >
              Inspect
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenDrawer?.(pipelineTab === 'TASKS' ? 'tasks' : 'projects')}
            className="w-full text-left focus:outline-none"
          >
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {pipelineTab === 'TASKS' ? `${inProgressTasks}/${totalTasks}` : `${activeProjects}/${totalProjects}`}
              </span>
              <span className="text-[9px] uppercase text-violet-400 font-semibold tracking-wider">
                {pipelineTab === 'TASKS' ? 'In Progress' : 'Active Projects'}
              </span>
            </div>
            {/* Segmented status meter */}
            <div className="mt-2 flex items-center gap-1 w-full">
              <span className="h-1 flex-1 rounded-full bg-violet-400" />
              <span className="h-1 flex-1 rounded-full bg-violet-400/70" />
              <span className="h-1 flex-1 rounded-full bg-muted/60" />
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground/75 leading-tight">
              {pipelineTab === 'TASKS'
                ? 'Isolated worktree branches synced'
                : 'Strategic initiatives tracking'}
            </p>
          </button>
        </div>
      </div>

      {/* 3. CENTER: LIVING 3D MAGNETIC GRAIN ORB */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <MagneticGrainOrb state={state} onOpenDrawer={onOpenDrawer} />
      </div>

      {/* 4. RIGHT FLANK TELEMETRY (Executive Gate with 1-click approvals, Enclave, Capital Burn) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 select-none z-10 font-mono text-right items-end w-[230px]">
        {/* Node 1: Executive Gate / Approvals with 1-Click Decision Action */}
        <div
          className={`flex flex-col items-end text-right p-3 rounded-xl border backdrop-blur-md transition-all shadow-xs w-full ${
            pendingApprovals > 0
              ? 'border-[#D71921]/60 bg-[#D71921]/5 hover:bg-[#D71921]/10'
              : 'border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/70'
          }`}
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span
              className={`text-[9px] font-semibold ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-emerald-400'
              }`}
            >
              {pendingApprovals > 0 ? 'Action Req' : 'Clear'}
            </span>
            <button
              type="button"
              onClick={() => onOpenDrawer?.('approvals')}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group focus:outline-none"
            >
              <span>Executive Gate</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  pendingApprovals > 0 ? 'bg-[#D71921] animate-ping' : 'bg-emerald-400'
                }`}
              />
            </button>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold tracking-tight ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-foreground'
              }`}
            >
              {pendingApprovals}
            </span>
            <span
              className={`text-[9px] uppercase font-semibold tracking-wider ${
                pendingApprovals > 0 ? 'text-[#D71921]' : 'text-emerald-400'
              }`}
            >
              {pendingApprovals > 0 ? 'Pending' : 'Nominal'}
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

          {/* 1-Click Inline Approval Gate Controls when pending */}
          {pendingApprovals > 0 && firstApproval && onDecideApproval ? (
            <div className="mt-2.5 pt-2 border-t border-border/40 w-full flex flex-col items-end gap-1.5">
              <p className="text-[9px] text-muted-foreground truncate w-full text-right" title={firstApproval.reason || firstApproval.action_type}>
                {firstApproval.action_type}: {firstApproval.reason}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDecideApproval(firstApproval.id, 'APPROVED')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[9px] font-bold transition-colors"
                  title="Approve immediately"
                >
                  <Check className="h-2.5 w-2.5" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDecideApproval(firstApproval.id, 'REJECTED')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#D71921]/10 hover:bg-[#D71921]/20 text-[#D71921] border border-[#D71921]/30 text-[9px] font-bold transition-colors"
                  title="Reject action"
                >
                  <X className="h-2.5 w-2.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[9px] text-muted-foreground/75 leading-tight">
              Constitutional boundary verified
            </p>
          )}
        </div>

        {/* Node 2: Resource Compute & Memory */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('resources')}
          className="group relative flex flex-col items-end text-right p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 transition-all focus:outline-none w-full shadow-xs"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[9px] text-cyan-400 font-semibold">{compute}%</span>
            <span className="flex items-center gap-1.5">
              <span>Compute Enclave</span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {compute}%
            </span>
            <span className="text-[9px] uppercase text-cyan-400 font-semibold tracking-wider">
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
          <p className="mt-1 text-[9px] text-muted-foreground/75 leading-tight">
            Memory ceiling: 64 GB isolated
          </p>
        </button>

        {/* Node 3: Budget Burn Rate & Quotas */}
        <button
          type="button"
          onClick={() => onOpenDrawer?.('resources')}
          className="group relative flex flex-col items-end text-right p-3 rounded-xl border border-border/40 bg-card/40 backdrop-blur-md hover:border-border/80 hover:bg-card/70 transition-all focus:outline-none w-full shadow-xs"
        >
          <div className="flex items-center justify-between w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="text-[9px] text-amber-400 font-semibold">{budgetPct}%</span>
            <span className="flex items-center gap-1.5">
              <span>Capital Burn</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
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
          <p className="mt-1 text-[9px] text-muted-foreground/75 leading-tight">
            Monthly executive allocation
          </p>
        </button>
      </div>
    </div>
  );
}
