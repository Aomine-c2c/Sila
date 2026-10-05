'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  FolderGit2,
  Radio,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type { Agent } from '@/lib/api/agents';
import type { ControlRoomState, Project, ResourceSummary, Task } from '@/lib/api/controlRoom';
import type { OrganizationalAdaptation } from '@/lib/api/evolution';
import { OrganizationActivityTimeline } from '@/components/OrganizationActivityTimeline';
import type { ActivityConnection, ActivityTransport } from '@/hooks/useActivityStream';

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
}

const OPEN_EVOLUTION = new Set(['PROPOSED', 'SIMULATING', 'SIMULATED', 'VALIDATED', 'PENDING_APPROVAL']);

function agentWork(agent: Agent, tasks: Task[]) {
  return tasks.find((task) => task.assigned_agent_id === agent.id && (task.status === 'IN_PROGRESS' || task.status === 'BLOCKED'));
}

function statusTone(status: string) {
  const key = status.toUpperCase();
  if (key === 'WORKING' || key === 'IN_PROGRESS' || key === 'ACTIVE' || key === 'ONLINE') {
    return 'bg-emerald-500/15 text-emerald-400';
  }
  if (key === 'BLOCKED' || key === 'OFFLINE' || key === 'CRITICAL') {
    return 'bg-rose-500/15 text-rose-400';
  }
  if (key === 'PENDING' || key === 'DEGRADED' || key === 'ON_HOLD' || key === 'WAITING' || key === 'PAUSED') {
    return 'bg-amber-500/15 text-amber-400';
  }
  return 'bg-secondary text-muted-foreground';
}

function metric(label: string, value: string, hint: string, attention = false) {
  return (
    <div className={`rounded-xl border bg-card/70 p-4 ${attention ? 'border-amber-500/40' : 'border-border/70'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyCard({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
        {action} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  href,
  children,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/60 p-5">
      <header className="mb-4 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-xs font-medium text-primary hover:underline">
            Open
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

export function ControlRoomDashboard({
  companyName,
  companyStatus,
  industry,
  state,
  live,
  isRefetching,
  previewMode,
  onDecideApproval,
}: ControlRoomDashboardProps) {
  const working = state.agents.filter((agent) => agent.status === 'WORKING');
  const blockedAgents = state.agents.filter((agent) => agent.status === 'BLOCKED');
  const activeProjects = state.projects.filter((project) => project.status === 'ACTIVE');
  const runningTasks = state.tasks.filter((task) => task.status === 'IN_PROGRESS');
  const blockedTasks = state.tasks.filter((task) => task.status === 'BLOCKED');
  const pendingApprovals = state.approvals.filter((item) => item.status === 'PENDING');
  const recentDecisions = [...state.decisions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const proposals = state.evolutionProposals.filter((item) => OPEN_EVOLUTION.has(item.status));
  const degradedProviders = state.providers.filter((provider) => provider.status !== 'ONLINE');
  const isNewCompany =
    state.agents.length === 0 &&
    state.projects.length === 0 &&
    state.tasks.length === 0 &&
    state.approvals.length === 0 &&
    state.activity.length === 0;

  const alerts = [
    ...blockedTasks.map((task) => ({
      id: `task-${task.id}`,
      label: `Blocked: ${task.title}`,
      href: '/dashboard/tasks',
    })),
    ...blockedAgents.map((agent) => ({
      id: `agent-${agent.id}`,
      label: `${agent.name} is blocked`,
      href: '/dashboard/agents',
    })),
    ...pendingApprovals.map((item) => ({
      id: `appr-${item.id}`,
      label: `Approval: ${item.action_type}`,
      href: '/dashboard/approvals',
    })),
    ...degradedProviders.map((provider) => ({
      id: `prov-${provider.id}`,
      label: `${provider.name} is ${provider.status.toLowerCase()}`,
      href: '/dashboard/intelligence',
    })),
  ];

  const liveLabel =
    live.connection === 'CONNECTED'
      ? live.transport === 'Preview'
        ? 'Sample live picture'
        : `Live · ${live.transport}`
      : live.connection === 'CONNECTING'
        ? 'Connecting'
        : 'Polling for updates';

  const budgetHint =
    state.resources.budget_spent_usd === null || state.resources.budget_allocated_usd === null
      ? 'Budget telemetry unavailable'
      : `$${state.resources.budget_spent_usd.toFixed(0)} of $${state.resources.budget_allocated_usd} budget`;

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isRefetching ? 'opacity-80' : 'opacity-100'}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nexora Control Room</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{companyName}</h1>
            {companyStatus && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(companyStatus)}`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-current ${live.connection === 'CONNECTED' ? 'animate-pulse' : ''}`} />
                {companyStatus}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {industry || 'Organization'} · operating picture
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          <Radio className={`h-3.5 w-3.5 ${live.connection === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}`} aria-hidden="true" />
          {liveLabel}
        </div>
      </div>

      {isNewCompany && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-5 py-6">
          <h2 className="text-base font-semibold text-foreground">This company is ready to start</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Nothing is running yet. Hire agents, open a project, or apply a blueprint. The Control Room will show work, blockers, spend, and approvals as soon as they exist.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/agents" className="btn btn-primary h-9 px-3 text-xs">Hire agents</Link>
            <Link href="/dashboard/projects" className="btn btn-outline h-9 px-3 text-xs">Create a project</Link>
            <Link href="/dashboard/blueprints" className="btn btn-outline h-9 px-3 text-xs">Use a blueprint</Link>
          </div>
        </div>
      )}

      <section aria-label="Company status">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Company status</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          {metric('Happening now', `${activeProjects.length} projects`, `${runningTasks.length} tasks in progress`)}
          {metric('Needs attention', String(alerts.length), alerts.length ? 'Blockers, approvals, or degraded providers' : 'Nothing waiting on you', alerts.length > 0)}
          {metric('Agents', `${working.length} working`, `${state.agents.length} in the company · ${blockedAgents.length} blocked`)}
          {metric('Resources', budgetHint, state.resources.compute_used_pct === null ? 'Compute unavailable' : `${state.resources.compute_used_pct}% compute`)}
          {metric('Blocked', String(blockedTasks.length + blockedAgents.length), blockedTasks.length ? `${blockedTasks.length} tasks cannot proceed` : 'No blocked work')}
          {metric('Approvals', String(pendingApprovals.length), pendingApprovals.length ? 'Human decision required' : 'No pending gates', pendingApprovals.length > 0)}
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="rounded-2xl border border-amber-500/35 bg-amber-500/5 p-4" aria-label="Alerts">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-amber-200">Alerts</h2>
            <span className="text-xs text-amber-200/70">{alerts.length}</span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {alerts.slice(0, 6).map((alert) => (
              <li key={alert.id}>
                <Link href={alert.href} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-background/40 px-3 py-2 text-sm text-foreground hover:border-amber-400/40">
                  {alert.label}
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Section eyebrow="Workforce" title="Active agents" href="/dashboard/agents">
            {state.agents.length === 0 ? (
              <EmptyCard
                title="No agents yet"
                body="Agents are AI employees. Hire one to start analysis, delivery, and review."
                href="/dashboard/agents"
                action="Add the first agent"
              />
            ) : (
              <ul className="space-y-2">
                {state.agents.slice(0, 6).map((agent) => {
                  const task = agentWork(agent, state.tasks);
                  return (
                    <li key={agent.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                          <p className="truncate text-sm font-medium text-foreground">{agent.name}</p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {task ? task.title : agent.status === 'AVAILABLE' ? 'Idle · available' : 'No current task'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(agent.status)}`}>
                        {agent.status === 'WORKING' && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
                        {agent.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section eyebrow="Delivery" title="Active projects" href="/dashboard/projects">
              {activeProjects.length === 0 ? (
                <EmptyCard
                  title="No active projects"
                  body="Projects group agent work around an objective."
                  href="/dashboard/projects"
                  action="Start a project"
                />
              ) : (
                <ul className="space-y-2">
                  {activeProjects.slice(0, 4).map((project) => (
                    <ProjectRow key={project.id} project={project} tasks={state.tasks} />
                  ))}
                </ul>
              )}
            </Section>

            <Section eyebrow="Work" title="Tasks" href="/dashboard/tasks">
              {state.tasks.length === 0 ? (
                <EmptyCard
                  title="No tasks yet"
                  body="Tasks show what is running, waiting, or blocked."
                  href="/dashboard/tasks"
                  action="Open tasks"
                />
              ) : (
                <ul className="space-y-2">
                  {state.tasks.slice(0, 5).map((task) => (
                    <li key={task.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-[11px] text-muted-foreground">{task.priority}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section eyebrow="Capacity" title="Resource utilization" href="/dashboard/resources">
              <ResourcePanel resources={state.resources} />
            </Section>
            <Section eyebrow="Models" title="Intelligence usage" href="/dashboard/intelligence">
              {state.providers.length === 0 ? (
                <EmptyCard
                  title="No provider telemetry"
                  body="Connect a model provider to see latency, tokens, and cost."
                  href="/dashboard/intelligence"
                  action="Configure intelligence"
                />
              ) : (
                <ul className="space-y-2">
                  {state.providers.map((provider) => (
                    <li key={provider.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${provider.status === 'ONLINE' ? 'bg-emerald-400' : provider.status === 'DEGRADED' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{provider.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {provider.active_requests === null ? '—' : `${provider.active_requests} in flight`}
                            {' · '}
                            {provider.avg_latency_ms === null ? 'latency —' : `${provider.avg_latency_ms}ms`}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-xs text-foreground">{provider.cost_usd === null ? '—' : `$${provider.cost_usd.toFixed(2)}`}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section eyebrow="Governance" title="Recent decisions" href="/dashboard/decisions">
              {recentDecisions.length === 0 ? (
                <EmptyCard
                  title="No decisions recorded"
                  body="Councils and owners will leave an immutable record here."
                  href="/dashboard/decisions"
                  action="Open decisions"
                />
              ) : (
                <ul className="space-y-2">
                  {recentDecisions.slice(0, 4).map((decision) => (
                    <li key={decision.id} className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{decision.problem}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(decision.status)}`}>
                          {decision.status}
                        </span>
                      </div>
                      {decision.decision && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{decision.decision}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section eyebrow="Adaptation" title="Evolution proposals" href="/dashboard/evolution">
              {proposals.length === 0 ? (
                <EmptyCard
                  title="No open proposals"
                  body="When the organization suggests a change, it waits here for simulation and approval."
                  href="/dashboard/evolution"
                  action="Open Evolution Center"
                />
              ) : (
                <ul className="space-y-2">
                  {proposals.slice(0, 4).map((proposal) => (
                    <ProposalRow key={proposal.id} proposal={proposal} />
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-4 xl:self-start">
          <Section eyebrow="Human in the loop" title="Pending approvals" href="/dashboard/approvals">
            {pendingApprovals.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-6 text-center">
                <Shield className="mx-auto mb-2 h-5 w-5 text-emerald-400" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">No approvals waiting</p>
                <p className="mt-1 text-xs text-muted-foreground">Consequential actions will pause here until you decide.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pendingApprovals.map((item) => (
                  <li key={item.id} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{item.action_type}</p>
                      <span className="text-[10px] font-semibold uppercase text-amber-300">{item.risk_level}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.reason}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={!onDecideApproval}
                        title={previewMode || !onDecideApproval ? 'Read-only in preview' : 'Approve'}
                        onClick={() => onDecideApproval?.(item.id, 'APPROVED')}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={!onDecideApproval}
                        title={previewMode || !onDecideApproval ? 'Read-only in preview' : 'Reject'}
                        onClick={() => onDecideApproval?.(item.id, 'REJECTED')}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-secondary px-2 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section eyebrow="Activity stream" title="Organization timeline" href="/dashboard/activity">
            <OrganizationActivityTimeline
              events={state.activity}
              audits={state.audits}
              maxItems={10}
              freshIds={live.freshIds}
              emptyHint="09:42-style entries appear when agents complete work, raise concerns, or request approval."
            />
          </Section>
        </aside>
      </div>
    </div>
  );
}

function ProjectRow({ project, tasks }: { project: Project; tasks: Task[] }) {
  const related = tasks.filter((task) => task.project_id === project.id);
  const done = related.filter((task) => task.status === 'COMPLETED').length;
  const pct = related.length ? Math.round((done / related.length) * 100) : 0;
  return (
    <li className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <FolderGit2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(project.status)}`}>
          {project.status}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {related.length ? `${done}/${related.length} tasks complete` : project.priority}
      </p>
    </li>
  );
}

function ResourcePanel({ resources }: { resources: ResourceSummary }) {
  const compute = resources.compute_used_pct;
  const spent = resources.budget_spent_usd;
  const allocated = resources.budget_allocated_usd;
  const budgetPct = spent !== null && allocated && allocated > 0 ? Math.min(100, (spent / allocated) * 100) : null;
  if (compute === null && spent === null && resources.token_usage_total === null) {
    return (
      <EmptyCard
        title="No resource telemetry"
        body="Budgets, compute, and token use will show once the Resource Engine reports in."
        href="/dashboard/resources"
        action="Open resources"
      />
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3" /> Compute</span>
          <span className="font-mono text-foreground">{compute === null ? '—' : `${compute}%`}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${compute ?? 0}%` }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Budget</span>
          <span className="font-mono text-foreground">{budgetPct === null ? '—' : `${budgetPct.toFixed(0)}%`}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${budgetPct ?? 0}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-border/50 px-2 py-2">
          <p className="text-[10px] uppercase text-muted-foreground">Tokens</p>
          <p className="font-mono text-sm text-foreground">{resources.token_usage_total === null ? '—' : `${(resources.token_usage_total / 1000).toFixed(1)}k`}</p>
        </div>
        <div className="rounded-lg border border-border/50 px-2 py-2">
          <p className="text-[10px] uppercase text-muted-foreground">Intelligence $</p>
          <p className="font-mono text-sm text-foreground">{resources.intelligence_cost_usd === null ? '—' : `$${resources.intelligence_cost_usd.toFixed(2)}`}</p>
        </div>
      </div>
    </div>
  );
}

function ProposalRow({ proposal }: { proposal: OrganizationalAdaptation }) {
  return (
    <li className="rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">{proposal.title}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(proposal.status)}`}>
          {proposal.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{proposal.expected_improvement}</p>
    </li>
  );
}
