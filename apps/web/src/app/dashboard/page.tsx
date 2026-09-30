'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Loader2,
  AlertTriangle,
  GitGraph,
  LayoutDashboard,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { organizationsApi } from '@/lib/api/organizations';
import { controlRoomApi, type ControlRoomState } from '@/lib/api/controlRoom';
import { OrganizationalGraph } from '@/components/OrganizationalGraph';
import { OperationalPulseCards } from '@/components/OperationalPulseCards';
import { OperationalGrid } from '@/components/OperationalGrid';

export default function ControlRoomPage() {
  const qc = useQueryClient();
  const { activeCompany, user } = useAuthStore();
  const companyId = activeCompany?.id;

  const [activeTab, setActiveTab] = useState<'control' | 'graph'>('control');

  // Load companies if none active
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => organizationsApi.list(),
    enabled: !companyId,
    staleTime: 30_000,
  });

  // Load full operational state
  const {
    data: state,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<ControlRoomState>({
    queryKey: ['control-room-state', companyId],
    queryFn: () => controlRoomApi.getOperationalState(companyId!),
    enabled: !!companyId,
    staleTime: 15_000,
  });

  // Approval decision mutation
  const approvalMutation = useMutation({
    mutationFn: ({ approvalId, decision }: { approvalId: string; decision: 'APPROVED' | 'REJECTED' }) =>
      controlRoomApi.decideApproval(companyId!, approvalId, decision, 'Supervisory human decision from Control Room'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['control-room-state', companyId] });
    },
  });

  // Empty state when no company exists
  if (!companyId) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome{user?.first_name ? `, ${user.first_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            NEXORA — Autonomous Organization OS
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-border py-24">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-xl font-semibold text-foreground">
                Create your first organization
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Build an AI-powered company with departments, agents, workflows, and governance — all in one place.
              </p>
            </div>
            <Link
              href="/dashboard/organizations"
              id="create-first-company-btn"
              className="btn btn-primary gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Organization
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
              <div>
                <p className="font-medium text-amber-300">No active organization selected</p>
                <p className="text-sm text-amber-400/80 mt-0.5">
                  Go to{' '}
                  <Link href="/dashboard/organizations" className="underline hover:text-amber-300">
                    Organizations
                  </Link>{' '}
                  and click &quot;Set Active&quot; on a company.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Mission Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {activeCompany.name}
            </h1>
            <span className="badge badge-success text-xs">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              {activeCompany.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
            <span>{activeCompany.industry || 'AI Enterprise'}</span>
            <span>•</span>
              <span className="text-primary font-medium">ORGANIZATION / OPERATING PICTURE</span>
          </p>
        </div>

        {/* View Switcher Tabs & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-secondary/60 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab('control')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'control'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Operating picture
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'graph'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GitGraph className="h-3.5 w-3.5 text-primary" />
              Organizational Graph
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="btn btn-outline h-9 px-3 text-xs gap-1.5"
            title="Refresh Real-time Operational Telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono text-muted-foreground">Synthesizing organization operating telemetry…</p>
        </div>
      )}

      {/* Operational State Loaded */}
      {!isLoading && state && (
        <div className="space-y-6">
          {/* Executive Pulse Row (What is company doing? What are agents doing? Blocked? Resources?) */}
          <OperationalPulseCards
            agents={state.agents}
            projects={state.projects}
            tasks={state.tasks}
            approvals={state.approvals}
            audits={state.audits}
            resources={state.resources}
            decisions={state.decisions}
          />

          {/* Tab 1: Unified Mission Control Layout */}
          {activeTab === 'control' && (
            <div className="space-y-6 animate-fade-in">
              {/* Interactive Graph Section embedded directly on dashboard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Interactive Organization Map & Provenance Mesh
                  </h2>
                  <span className="text-[11px] font-mono text-primary cursor-pointer hover:underline" onClick={() => setActiveTab('graph')}>
                    Expand Fullscreen View →
                  </span>
                </div>
                <OrganizationalGraph
                  companyName={activeCompany.name}
                  departments={state.departments}
                  agents={state.agents}
                  projects={state.projects}
                  tasks={state.tasks}
                  decisions={state.decisions}
                />
              </div>

              {/* 15 Domains Operational Grid */}
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Organizational Activity & Governance Execution
                </h2>
                <OperationalGrid
                  companyId={companyId}
                  departments={state.departments}
                  agents={state.agents}
                  projects={state.projects}
                  tasks={state.tasks}
                  approvals={state.approvals}
                  audits={state.audits}
                  resources={state.resources}
                  decisions={state.decisions}
                  policies={state.policies}
                  memories={state.memories}
                  providers={state.providers}
                  onDecideApproval={(approvalId, decision) =>
                    approvalMutation.mutate({ approvalId, decision })
                  }
                />
              </div>
            </div>
          )}

          {/* Tab 2: Full-screen Organizational Graph Explorer */}
          {activeTab === 'graph' && (
            <div className="animate-fade-in space-y-4">
              <OrganizationalGraph
                companyName={activeCompany.name}
                departments={state.departments}
                agents={state.agents}
                projects={state.projects}
                tasks={state.tasks}
                decisions={state.decisions}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
