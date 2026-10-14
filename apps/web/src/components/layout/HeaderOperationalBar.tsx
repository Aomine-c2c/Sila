'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  GitBranch,
  Briefcase,
  CheckSquare,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganizationContext } from '@/lib/organizationContext';
import { api } from '@/lib/api/client';

interface OperationalAction {
  id: string;
  name: string;
  shortLabel: string;
  code: string;
  href: string;
  icon: React.ElementType;
}

const OPERATIONAL_ACTIONS: OperationalAction[] = [
  { id: 'agents', name: 'AI Workforce', shortLabel: 'Workforce', code: 'WF', href: '/dashboard/agents', icon: Bot },
  { id: 'councils', name: 'Agent Councils', shortLabel: 'Councils', code: 'CN', href: '/dashboard/councils', icon: Users },
  { id: 'workflows', name: 'Workflows', shortLabel: 'Workflows', code: 'WF', href: '/dashboard/workflows', icon: GitBranch },
  { id: 'projects', name: 'Projects', shortLabel: 'Projects', code: 'PR', href: '/dashboard/projects', icon: Briefcase },
  { id: 'tasks', name: 'Tasks Matrix', shortLabel: 'Tasks', code: 'TK', href: '/dashboard/tasks', icon: CheckSquare },
  { id: 'approvals', name: 'Approvals Gate', shortLabel: 'Approvals', code: 'AP', href: '/dashboard/approvals', icon: Shield },
];

interface HeaderOperationalBarProps {
  onOpenDrawer?: (drawerId: string) => void;
  activeDrawerId?: string | null;
}

export function HeaderOperationalBar({ onOpenDrawer, activeDrawerId }: HeaderOperationalBarProps) {
  const pathname = usePathname();
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';

  const isActive = (id: string, href: string) => {
    if (activeDrawerId) return activeDrawerId === id;
    return pathname.startsWith(href);
  };

  // Live telemetry metrics for high-frequency operational domains
  const { data: counts } = useQuery({
    queryKey: ['header-operational-counts', companyId],
    queryFn: async () => {
      if (!companyId) return {};
      const [agentsRes, tasksRes, approvalsRes, workflowsRes] = await Promise.allSettled([
        api.get<any[]>(`/api/v1/companies/${companyId}/agents`),
        api.get<any[]>(`/api/v1/companies/${companyId}/tasks`),
        api.get<any[]>(`/api/v1/companies/${companyId}/governance/approvals?status=PENDING`),
        api.get<any[]>(`/api/v1/companies/${companyId}/workflows`),
      ]);

      const activeAgents = agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)
        ? agentsRes.value.filter((a) => a.status === 'ACTIVE' || a.status === 'RUNNING' || a.status === 'IDLE').length
        : undefined;

      const pendingTasks = tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value)
        ? tasksRes.value.filter((t) => t.status !== 'DONE' && t.status !== 'COMPLETED').length
        : undefined;

      const pendingApprovals = approvalsRes.status === 'fulfilled' && Array.isArray(approvalsRes.value)
        ? approvalsRes.value.length
        : undefined;

      const activeWorkflows = workflowsRes.status === 'fulfilled' && Array.isArray(workflowsRes.value)
        ? workflowsRes.value.length
        : undefined;

      return {
        agents: activeAgents,
        tasks: pendingTasks,
        approvals: pendingApprovals,
        workflows: activeWorkflows,
      };
    },
    enabled: !!companyId,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return (
    <nav
      className="hidden md:flex items-center gap-1.5 font-mono text-xs select-none"
      aria-label="High-frequency operational navigation"
    >
      <div className="h-4 w-px bg-border/80 mx-1.5" aria-hidden="true" />
      {OPERATIONAL_ACTIONS.map((item, idx) => {
        const active = isActive(item.id, item.href);
        const Icon = item.icon;
        
        let badgeCount: number | undefined;
        let isAttention = false;
        if (item.id === 'approvals' && typeof counts?.approvals === 'number') {
          badgeCount = counts.approvals;
          isAttention = counts.approvals > 0;
        } else if (item.id === 'agents' && typeof counts?.agents === 'number') {
          badgeCount = counts.agents;
        } else if (item.id === 'tasks' && typeof counts?.tasks === 'number') {
          badgeCount = counts.tasks;
        }

        const handleClick = (e: React.MouseEvent) => {
          if (onOpenDrawer) {
            e.preventDefault();
            onOpenDrawer(item.id);
          }
        };

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={handleClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-mono transition-all duration-150',
              active
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-border/40'
            )}
            title={`${item.name} (Press ${idx + 1})`}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                active ? 'text-[#D71921]' : 'text-muted-foreground group-hover:text-foreground'
              )}
              aria-hidden="true"
            />
            {/* Short code on tablet, full label on wide screens */}
            <span className="uppercase tracking-wider text-[10px] xl:hidden font-mono">
              {item.code}
            </span>
            <span className="uppercase tracking-wider hidden xl:inline text-[10px] font-mono">
              {item.shortLabel}
            </span>

            {/* Live Telemetry Count Badge */}
            {typeof badgeCount === 'number' && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-mono tabular-nums leading-none',
                  active
                    ? 'bg-background text-foreground'
                    : isAttention
                      ? 'bg-[#D71921]/15 text-[#D71921] font-bold border border-[#D71921]/30'
                      : 'bg-muted text-muted-foreground border border-border/40'
                )}
              >
                {badgeCount}
              </span>
            )}

            {/* Glowing active red dot matrix pip */}
            {active && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#D71921] shadow-[0_0_6px_#D71921]"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
