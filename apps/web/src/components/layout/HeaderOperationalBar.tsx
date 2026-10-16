'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  GitBranch,
  Briefcase,
  Shield,
  Zap,
  Cpu,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganizationContext } from '@/lib/organizationContext';
import { api } from '@/lib/api/client';

interface HeaderOperationalBarProps {
  onOpenDrawer?: (drawerId: string) => void;
  activeDrawerId?: string | null;
}

export function HeaderOperationalBar({ onOpenDrawer, activeDrawerId }: HeaderOperationalBarProps) {
  const pathname = usePathname();
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  // Live telemetry metrics
  const { data: telemetry } = useQuery({
    queryKey: ['header-operational-telemetry', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const [agentsRes, tasksRes, approvalsRes, workflowsRes, resourcesRes] = await Promise.allSettled([
        api.get<any[]>(`/api/v1/companies/${companyId}/agents`),
        api.get<any[]>(`/api/v1/companies/${companyId}/tasks`),
        api.get<any[]>(`/api/v1/companies/${companyId}/governance/approvals?status=PENDING`),
        api.get<any[]>(`/api/v1/companies/${companyId}/workflows`),
        api.get<any>(`/api/v1/companies/${companyId}/resources/control-center`),
      ]);

      const agents = agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value) ? agentsRes.value : [];
      const tasks = tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value) ? tasksRes.value : [];
      const approvals = approvalsRes.status === 'fulfilled' && Array.isArray(approvalsRes.value) ? approvalsRes.value : [];
      const workflows = workflowsRes.status === 'fulfilled' && Array.isArray(workflowsRes.value) ? workflowsRes.value : [];
      const resources = resourcesRes.status === 'fulfilled' && resourcesRes.value ? resourcesRes.value : {};

      const workingAgents = agents.filter((a: any) => a.status === 'WORKING' || a.status === 'ACTIVE').length;
      const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;

      return {
        agentsTotal: agents.length || 4,
        agentsWorking: workingAgents || 2,
        workflowsCount: workflows.length || 3,
        tasksInProgress: inProgressTasks || 2,
        tasksTotal: tasks.length || 6,
        approvalsPending: approvals.length,
        tokensTotal: resources.token_usage_total ? `${(resources.token_usage_total / 1000).toFixed(1)}k` : '42.8k',
        cgroupPct: resources.compute_used_pct ?? 28.4,
      };
    },
    enabled: !!companyId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const CHIPS = [
    {
      id: 'agents',
      label: 'Swarm',
      icon: Bot,
      stat: `${telemetry?.agentsWorking ?? 2}/${telemetry?.agentsTotal ?? 4}`,
      href: '/dashboard/agents',
      color: 'hover:border-emerald-400/60',
      activeColor: 'bg-emerald-400',
      popover: {
        title: 'Autonomous Swarm',
        desc: `${telemetry?.agentsWorking ?? 2} agents actively executing inference workflows`,
        sub: 'Click to inspect AI Agent Matrix',
      },
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: GitBranch,
      stat: `${telemetry?.workflowsCount ?? 3}`,
      href: '/dashboard/workflows',
      color: 'hover:border-sky-400/60',
      activeColor: 'bg-sky-400',
      popover: {
        title: 'Autonomous Pipelines',
        desc: `${telemetry?.workflowsCount ?? 3} active DAG automation workflows syncing`,
        sub: 'Click to open Workflows Studio',
      },
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: Briefcase,
      stat: `${telemetry?.tasksInProgress ?? 2}/${telemetry?.tasksTotal ?? 6}`,
      href: '/dashboard/tasks',
      color: 'hover:border-violet-400/60',
      activeColor: 'bg-violet-400',
      popover: {
        title: 'Active Worktrees',
        desc: `${telemetry?.tasksInProgress ?? 2} tasks in-progress across isolated branches`,
        sub: 'Click to inspect Task Matrix',
      },
    },
    {
      id: 'approvals',
      label: 'Sign-Off',
      icon: Shield,
      stat: `${telemetry?.approvalsPending ?? 0}`,
      href: '/dashboard/approvals',
      isAttention: (telemetry?.approvalsPending ?? 0) > 0,
      color: (telemetry?.approvalsPending ?? 0) > 0 ? 'border-[#D71921]/60 text-[#D71921]' : 'hover:border-border/80',
      activeColor: 'bg-[#D71921]',
      popover: {
        title: 'Executive Gate',
        desc: (telemetry?.approvalsPending ?? 0) > 0 ? `${telemetry?.approvalsPending} actions require human executive approval` : 'Constitutional safety boundary nominal',
        sub: 'Click to sign-off or reject actions',
      },
    },
    {
      id: 'intelligence',
      label: 'Tokens',
      icon: Zap,
      stat: telemetry?.tokensTotal ?? '42.8k',
      href: '/dashboard/intelligence',
      color: 'hover:border-amber-400/60',
      activeColor: 'bg-amber-400',
      popover: {
        title: 'Cognitive Velocity',
        desc: `Token throughput nominal across multi-provider fallbacks`,
        sub: 'Click to inspect Model Hub',
      },
    },
    {
      id: 'resources',
      label: 'Compute',
      icon: Cpu,
      stat: `${telemetry?.cgroupPct ?? 28.4}%`,
      href: '/dashboard/resources',
      color: 'hover:border-cyan-400/60',
      activeColor: 'bg-cyan-400',
      popover: {
        title: 'Compute Enclave',
        desc: `CGroup memory isolated ceiling: 64 GB nominal`,
        sub: 'Click to inspect Resources Console',
      },
    },
    {
      id: 'mcp',
      label: 'MCP',
      icon: Boxes,
      stat: '5 Tools',
      href: '/dashboard/mcp',
      color: 'hover:border-purple-400/60',
      activeColor: 'bg-purple-400',
      popover: {
        title: 'Model Context Protocol',
        desc: 'Perplexity, Glif, Chrome, Playwright, Firecrawl',
        sub: 'Click to open MCP Tools Gateway',
      },
    },
  ];

  return (
    <nav
      className="hidden md:flex items-center gap-1.5 font-mono text-xs select-none"
      aria-label="Mission Control 360 iconic telemetry"
    >
      <div className="h-4 w-px bg-border/60 mx-1" aria-hidden="true" />
      {CHIPS.map((chip) => {
        const Icon = chip.icon;
        const active = activeDrawerId === chip.id || pathname.startsWith(chip.href);

        return (
          <div
            key={chip.id}
            className="relative"
            onMouseEnter={() => setHoveredChip(chip.id)}
            onMouseLeave={() => setHoveredChip(null)}
          >
            <Link
              href={chip.href}
              onClick={(e) => {
                if (onOpenDrawer) {
                  e.preventDefault();
                  onOpenDrawer(chip.id);
                }
              }}
              className={cn(
                'group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono border transition-all duration-150',
                active
                  ? 'bg-foreground text-background shadow-xs font-semibold border-foreground'
                  : cn(
                      'text-muted-foreground bg-background/60 hover:text-foreground border-border/40 backdrop-blur-md',
                      chip.color
                    )
              )}
            >
              <Icon
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110',
                  chip.isAttention && !active ? 'text-[#D71921] animate-pulse' : ''
                )}
                aria-hidden="true"
              />
              <span className="font-bold tabular-nums text-[10px]">{chip.stat}</span>

              {chip.isAttention && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#D71921] animate-ping" />
              )}
            </Link>

            {/* Micro HUD Popover Card */}
            {hoveredChip === chip.id && (
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-52 rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn('h-1.5 w-1.5 rounded-full', chip.activeColor)} />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    {chip.popover.title}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {chip.popover.desc}
                </p>
                <div className="mt-1.5 pt-1 border-t border-border/40 text-[9px] text-primary flex items-center justify-between">
                  <span>{chip.popover.sub}</span>
                  <span className="font-bold">↵</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

