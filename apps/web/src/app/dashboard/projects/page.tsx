'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderKanban,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  Coins,
  CheckCircle2,
  Clock,
  ArrowRight,
  Tag,
  List as ListIcon,
  Kanban,
  GitBranch,
  CheckSquare,
  Bot,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { projectsApi, Project, ProjectStatus, CreateProjectRequest, Milestone, Task } from '@/lib/api/projects';
import { agentsApi, Agent } from '@/lib/api/agents';
import { governanceApi, GovernanceAuditLog } from '@/lib/api/governance';
import { decisionsApi, DecisionRecord } from '@/lib/api/decisions';
import { useOrganizationContext } from '@/lib/organizationContext';
import { ApiError } from '@/lib/api/client';
import { TaskDetailsDrawer } from '@/components/TaskDetailsDrawer';

const STATUS_BADGES: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  PLANNING: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  DRAFT: { bg: 'bg-muted/40', text: 'text-muted-foreground', border: 'border-border' },
  ACTIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  PAUSED: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  ON_HOLD: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  COMPLETED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  CANCELLED: { bg: 'bg-muted/40', text: 'text-muted-foreground', border: 'border-border' },
};

export default function ProjectsPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const qc = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'timeline' | 'graph'>('list');
  const [activeProjectTab, setActiveProjectTab] = useState<'overview' | 'milestones' | 'agents' | 'activity' | 'resources'>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Creation Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateProjectRequest>({
    name: '',
    objective: '',
    description: '',
    status: 'ACTIVE',
    budget: undefined,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // New Milestone Form State
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Queries
  const { data: projects = [], isLoading: isProjectsLoading, error } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => projectsApi.list(companyId),
    enabled: !!companyId,
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);
  const activeProjId = activeProject?.id;

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', companyId, activeProjId],
    queryFn: () => projectsApi.listTasks(companyId, activeProjId!),
    enabled: !!companyId && !!activeProjId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', companyId],
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: audits = [] } = useQuery({
    queryKey: ['governance-audits', companyId],
    queryFn: () => governanceApi.queryAudits(companyId, { limit: 20 }),
    enabled: !!companyId,
  });

  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', companyId],
    queryFn: () => decisionsApi.list(companyId),
    enabled: !!companyId,
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: (body: CreateProjectRequest) => projectsApi.create(companyId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', companyId] });
      setShowCreate(false);
      setForm({ name: '', objective: '', description: '', status: 'ACTIVE', budget: undefined });
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create project.');
    },
  });

  // Update milestones mutation
  const updateMilestonesMutation = useMutation({
    mutationFn: (milestones: Milestone[]) =>
      projectsApi.update(companyId, activeProjId!, { milestones }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', companyId] });
      setShowAddMilestone(false);
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
    },
  });

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !activeProject) return;
    const current = activeProject.milestones || [];
    const updated = [
      ...current,
      {
        title: newMilestoneTitle.trim(),
        due_date: newMilestoneDate || null,
        completed: false,
      },
    ];
    updateMilestonesMutation.mutate(updated);
  };

  const handleToggleMilestone = (idx: number) => {
    if (!activeProject) return;
    const current = [...(activeProject.milestones || [])];
    if (current[idx]) {
      current[idx] = { ...current[idx], completed: !current[idx].completed };
      updateMilestonesMutation.mutate(current);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    createMutation.mutate(form);
  };

  // Telemetry Calculations for active project
  const completedTasks = tasks.filter((t) => t.status === 'DONE' || t.status === 'COMPLETED');
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');
  const progressPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const projectMilestones = activeProject?.milestones || [];
  const completedMilestones = projectMilestones.filter((m) => m.completed);
  const milestoneProgressPct = projectMilestones.length > 0 ? Math.round((completedMilestones.length / projectMilestones.length) * 100) : 0;

  // Unique agents assigned to this project's tasks
  const assignedAgentIds = Array.from(new Set(tasks.map((t) => t.assigned_agent_id).filter(Boolean)));
  const assignedAgents = agents.filter((a) => assignedAgentIds.includes(a.id));

  // Incurred cost & token metrics
  const totalCost = tasks.reduce((sum, t) => sum + (t.cost_usd || t.estimated_cost || 0), 0);
  const totalTokens = tasks.reduce((sum, t) => sum + (t.tokens_consumed || t.estimated_tokens || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* 1. DIRECTORY HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Projects & Initiatives</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Autonomous Work Breakdown
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Organizational roadmaps, agent task allocation, milestones, and real-time autonomous execution
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary gap-2 self-start sm:self-auto"
          onClick={() => setShowCreate(true)}
          disabled={!companyId}
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* 2. PROJECT SELECTOR & VIEW MODE TOGGLE */}
      {projects.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-primary shrink-0" />
            <select
              value={activeProject?.id || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Select Project"
              className="input text-xs font-semibold py-1.5 h-9 bg-secondary/50 max-w-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {/* 4 Interchangeable View Modes */}
          <div className="flex items-center gap-1 border border-border/80 rounded-xl p-1 bg-secondary/40">
            {[
              { id: 'list', label: 'List', icon: ListIcon },
              { id: 'board', label: 'Board', icon: Kanban },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'graph', label: 'Dependency Graph', icon: GitBranch },
            ].map((v) => {
              const Icon = v.icon;
              const isActive = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id as typeof viewMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PROJECT OVERVIEW CARD (IF ACTIVE PROJECT EXISTS) */}
      {activeProject && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          {/* Top Row: Objective, Status, Progress, Owner, Deadline */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border/60">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{activeProject.name}</h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold ${
                    STATUS_BADGES[activeProject.status]?.bg
                  } ${STATUS_BADGES[activeProject.status]?.text} ${STATUS_BADGES[activeProject.status]?.border}`}
                >
                  {activeProject.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeProject.objective || activeProject.description || 'Deliver project deliverables autonomously within policy envelope.'}
              </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 text-center min-w-[100px]">
                <span className="text-[10px] text-muted-foreground block">Task Progress</span>
                <p className="text-base font-bold font-mono text-primary mt-0.5">{progressPct}%</p>
                <div className="w-full bg-secondary/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 text-center min-w-[100px]">
                <span className="text-[10px] text-muted-foreground block">Milestones</span>
                <p className="text-base font-bold font-mono text-purple-400 mt-0.5">
                  {completedMilestones.length}/{projectMilestones.length}
                </p>
                <span className="text-[9px] text-muted-foreground block mt-1">{milestoneProgressPct}% done</span>
              </div>

              <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 text-center min-w-[100px]">
                <span className="text-[10px] text-muted-foreground block">Resource Spend</span>
                <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  ${totalCost.toFixed(3)}
                </p>
                <span className="text-[9px] text-muted-foreground block mt-1">
                  Budget: {activeProject.budget ? `$${activeProject.budget}` : 'Unlimited'}
                </span>
              </div>

              <div className="bg-secondary/40 p-3 rounded-xl border border-border/50 text-center min-w-[100px]">
                <span className="text-[10px] text-muted-foreground block">Blocked Tasks</span>
                <p className={`text-base font-bold font-mono mt-0.5 ${blockedTasks.length > 0 ? 'text-rose-400 animate-pulse' : 'text-foreground'}`}>
                  {blockedTasks.length}
                </p>
                <span className="text-[9px] text-muted-foreground block mt-1">
                  {assignedAgents.length} Agents active
                </span>
              </div>
            </div>
          </div>

          {/* Project Sub-tabs: Overview, Milestones, Agent Assignments, Project Activity, Project Resources */}
          <div className="flex border-b border-border/60 gap-4 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Project Tasks & Backlog', icon: CheckSquare },
              { id: 'milestones', label: `Milestones (${projectMilestones.length})`, icon: Calendar },
              { id: 'agents', label: `Agent Assignments (${assignedAgents.length})`, icon: Bot },
              { id: 'activity', label: 'Project Activity', icon: Activity },
              { id: 'resources', label: 'Project Resources', icon: Coins },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeProjectTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProjectTab(tab.id as typeof activeProjectTab)}
                  className={`flex items-center gap-1.5 pb-2.5 border-b-2 transition-all ${
                    isActive
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* TAB 1: PROJECT TASKS & MULTI-VIEW (LIST, BOARD, TIMELINE, GRAPH)*/}
          {/* ============================================================== */}
          {activeProjectTab === 'overview' && (
            <div className="space-y-4">
              {/* VIEW 1: LIST VIEW */}
              {viewMode === 'list' && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase font-mono tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Task Title & Scope</th>
                        <th className="py-3 px-4">Executing Agent</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Dependencies</th>
                        <th className="py-3 px-4">Resource Cost</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {tasks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            No tasks created for this project yet. Use New Task in Task Backlog to delegate work.
                          </td>
                        </tr>
                      ) : (
                        tasks.map((t) => {
                          const ag = agents.find((a) => a.id === t.assigned_agent_id);
                          return (
                            <tr
                              key={t.id}
                              onClick={() => setSelectedTaskId(t.id)}
                              className="hover:bg-secondary/30 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-4">
                                <p className="font-semibold text-foreground">{t.title}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">#{t.id.slice(0, 8)}</p>
                              </td>
                              <td className="py-3 px-4">
                                {ag ? (
                                  <div className="flex items-center gap-1.5">
                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                    <span className="font-medium text-foreground">{ag.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`badge font-mono text-[10px] font-bold ${
                                  t.status === 'DONE' || t.status === 'COMPLETED'
                                    ? 'badge-primary'
                                    : t.status === 'BLOCKED'
                                    ? 'badge-destructive'
                                    : 'badge-default'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px]">
                                {t.priority}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px]">
                                {t.dependencies && t.dependencies.length > 0 ? (
                                  <span className="text-purple-400">{t.dependencies.length} prereqs</span>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                ${(t.cost_usd || t.estimated_cost || 0.012).toFixed(4)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskId(t.id);
                                  }}
                                  className="btn btn-outline h-7 px-2.5 text-xs text-primary"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 2: BOARD / KANBAN VIEW */}
              {viewMode === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { key: 'TODO', label: 'To Do', color: 'border-blue-500/40 text-blue-400' },
                    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/40 text-amber-400' },
                    { key: 'IN_REVIEW', label: 'In Review', color: 'border-purple-500/40 text-purple-400' },
                    { key: 'DONE', label: 'Done', color: 'border-emerald-500/40 text-emerald-400' },
                    { key: 'BLOCKED', label: 'Blocked', color: 'border-rose-500/40 text-rose-400' },
                  ].map((col) => {
                    const colTasks = tasks.filter((t) => {
                      if (col.key === 'DONE') return t.status === 'DONE' || t.status === 'COMPLETED';
                      if (col.key === 'TODO') return t.status === 'TODO' || t.status === 'BACKLOG' || t.status === 'PENDING';
                      return t.status === col.key;
                    });
                    return (
                      <div key={col.key} className="rounded-xl border border-border bg-secondary/20 p-3 space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                          <span className={`text-xs font-bold font-mono ${col.color}`}>{col.label}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {colTasks.map((t) => {
                            const ag = agents.find((a) => a.id === t.assigned_agent_id);
                            return (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTaskId(t.id)}
                                className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 cursor-pointer transition-all space-y-2"
                              >
                                <p className="text-xs font-semibold text-foreground line-clamp-2">{t.title}</p>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                                  {ag ? (
                                    <span className="flex items-center gap-1 text-primary truncate max-w-[120px]">
                                      <Bot className="h-3 w-3 shrink-0" />
                                      {ag.name}
                                    </span>
                                  ) : (
                                    <span className="italic">Unassigned</span>
                                  )}
                                  <span>{t.priority}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VIEW 3: TIMELINE (GANTT SCHEDULE) VIEW */}
              {viewMode === 'timeline' && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-semibold text-foreground">Project Timeline & Milestones</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Deadline: {activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString() : 'Continuous Delivery'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {projectMilestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-xs">
                        <div className="w-24 text-[11px] font-mono text-muted-foreground shrink-0">
                          {m.due_date ? new Date(m.due_date).toLocaleDateString() : `Phase ${idx + 1}`}
                        </div>
                        <div className="flex-1 bg-secondary/50 rounded-lg p-2.5 border border-border/60 flex items-center justify-between">
                          <span className={`font-semibold ${m.completed ? 'text-emerald-400 line-through' : 'text-foreground'}`}>
                            {m.title}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            m.completed
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {m.completed ? 'COMPLETED' : 'SCHEDULED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 4: DEPENDENCY GRAPH VIEW */}
              {viewMode === 'graph' && (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-semibold text-foreground">Task Precedence Topology</span>
                    <span className="text-[11px] font-mono text-primary">Autonomous Dependency Chain</span>
                  </div>

                  <div className="p-6 rounded-xl bg-secondary/20 border border-border/60 flex flex-wrap gap-6 items-center justify-center">
                    {tasks.map((t, idx) => {
                      const ag = agents.find((a) => a.id === t.assigned_agent_id);
                      return (
                        <div key={t.id} className="flex items-center gap-4">
                          <div
                            onClick={() => setSelectedTaskId(t.id)}
                            className={`p-3 rounded-xl border bg-card cursor-pointer hover:border-primary transition-all text-xs space-y-1.5 w-52 shadow-sm ${
                              t.status === 'DONE' || t.status === 'COMPLETED'
                                ? 'border-emerald-500/40'
                                : t.status === 'BLOCKED'
                                ? 'border-rose-500/40'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-muted-foreground">Task #{idx + 1}</span>
                              <span className="text-primary">{t.status}</span>
                            </div>
                            <p className="font-semibold text-foreground truncate">{t.title}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                              <Bot className="h-3 w-3 text-primary" />
                              <span className="truncate">{ag?.name || 'Unassigned'}</span>
                            </div>
                          </div>
                          {idx < tasks.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MILESTONES MANAGEMENT                                   */}
          {/* ============================================================== */}
          {activeProjectTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Key Project Deliverables & Milestones</span>
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(true)}
                  className="btn btn-outline text-xs h-7 px-2.5 gap-1 text-primary"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>

              {showAddMilestone && (
                <form onSubmit={handleAddMilestone} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <span className="text-xs font-bold text-foreground block">New Milestone Deliverable</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Milestone title, e.g. Finalize Multi-tenant Isolation Test Suite"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="input text-xs"
                      required
                    />
                    <input
                      type="date"
                      value={newMilestoneDate}
                      onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="input text-xs font-mono"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddMilestone(false)}
                      className="btn btn-outline text-xs h-7 px-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateMilestonesMutation.isPending}
                      className="btn btn-primary text-xs h-7 px-3"
                    >
                      Save Milestone
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {projectMilestones.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No milestones configured yet for this project.
                  </p>
                ) : (
                  projectMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-secondary/20 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() => handleToggleMilestone(idx)}
                          className="checkbox h-4 w-4"
                        />
                        <div>
                          <p className={`font-semibold ${m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {m.title}
                          </p>
                          {m.due_date && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              Due: {new Date(m.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        m.completed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {m.completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: AGENT ASSIGNMENTS                                       */}
          {/* ============================================================== */}
          {activeProjectTab === 'agents' && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-foreground block">
                Assigned AI Workforce Roster ({assignedAgents.length} Agents)
              </span>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {assignedAgents.map((ag) => {
                  const agTasks = tasks.filter((t) => t.assigned_agent_id === ag.id);
                  const int = (ag.intelligence_config || {}) as { provider?: string; model?: string };
                  return (
                    <div key={ag.id} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-foreground">{ag.name}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{ag.autonomy}</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground space-y-1 pt-2 border-t border-border/40">
                        <div>Model: {int.provider || 'anthropic'} • {int.model || 'claude-sonnet'}</div>
                        <div>Project Tasks: <strong className="text-primary">{agTasks.length}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: PROJECT ACTIVITY STREAM                                 */}
          {/* ============================================================== */}
          {activeProjectTab === 'activity' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-foreground block">
                Autonomous Action Provenance & Audit Stream
              </span>

              <div className="space-y-2">
                {audits.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-border bg-secondary/20 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{a.action}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{a.target || 'project-scope'} • Actor: {a.actor_name || a.actor_type || 'Agent'}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {a.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PROJECT RESOURCES & RECENT DECISIONS                     */}
          {/* ============================================================== */}
          {activeProjectTab === 'resources' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <span className="text-xs text-muted-foreground block">Total Tokens Consumed</span>
                  <p className="text-xl font-bold font-mono text-foreground mt-1">{totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <span className="text-xs text-muted-foreground block">Total Resource Spend</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">${totalCost.toFixed(4)}</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-secondary/30">
                  <span className="text-xs text-muted-foreground block">Allocated Budget Cap</span>
                  <p className="text-xl font-bold font-mono text-primary mt-1">
                    {activeProject.budget ? `$${activeProject.budget}` : 'Unlimited'}
                  </p>
                </div>
              </div>

              {/* Recent Decisions */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <span className="text-xs font-semibold text-foreground block">Recent Organizational Decisions</span>
                <div className="space-y-2">
                  {decisions.slice(0, 3).map((d) => (
                    <div key={d.id} className="p-3 rounded-lg bg-secondary/30 border border-border/40 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{d.title}</span>
                        <span className="text-[10px] font-mono text-primary">{d.status}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{d.problem}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TASK DETAILS DRAWER */}
      {selectedTaskId && activeProjId && (
        <TaskDetailsDrawer
          companyId={companyId}
          projectId={activeProjId}
          taskId={selectedTaskId}
          agents={agents}
          allTasks={tasks}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* 5. CREATION MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md glass rounded-2xl p-6 ring-1 ring-border shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Project Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full text-xs"
                  placeholder="e.g. Autonomous Security Hardening, Multi-tenant Isolation"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Strategic Objective
                </label>
                <textarea
                  rows={2}
                  className="input w-full text-xs h-auto resize-none"
                  placeholder="State the core objective delegated to autonomous agents..."
                  value={form.objective || ''}
                  onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Status
                  </label>
                  <select
                    className="input w-full text-xs"
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))
                    }
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Budget Ceiling ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input w-full text-xs font-mono"
                    placeholder="e.g. 500"
                    value={form.budget ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        budget: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1 text-xs"
                  onClick={() => {
                    setShowCreate(false);
                    setFormError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 text-xs"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
