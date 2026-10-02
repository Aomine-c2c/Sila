'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Plus,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  Filter,
  ArrowRight,
  Coins,
  Kanban,
  List as ListIcon,
  Calendar,
  GitBranch,
  Play,
  RotateCw,
  Search,
} from 'lucide-react';
import { projectsApi, Project, Task, TaskStatus, TaskPriority, CreateTaskRequest } from '@/lib/api/projects';
import { agentsApi, Agent } from '@/lib/api/agents';
import { useOrganizationContext } from '@/lib/organizationContext';
import { ApiError } from '@/lib/api/client';
import { TaskDetailsDrawer } from '@/components/TaskDetailsDrawer';

const STATUS_ICONS: Record<TaskStatus, { color: string; label: string }> = {
  BACKLOG: { color: 'text-muted-foreground', label: 'Backlog' },
  TODO: { color: 'text-blue-400', label: 'To Do' },
  PENDING: { color: 'text-blue-400', label: 'Pending' },
  IN_PROGRESS: { color: 'text-amber-400', label: 'In Progress' },
  IN_REVIEW: { color: 'text-purple-400', label: 'In Review' },
  DONE: { color: 'text-emerald-400', label: 'Done' },
  COMPLETED: { color: 'text-emerald-400', label: 'Completed' },
  BLOCKED: { color: 'text-rose-400', label: 'Blocked' },
  CANCELLED: { color: 'text-muted-foreground', label: 'Cancelled' },
};

const PRIORITY_BADGES: Record<TaskPriority, string> = {
  LOW: 'border-muted-foreground/30 text-muted-foreground bg-muted/20',
  MEDIUM: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  HIGH: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  CRITICAL: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
};

export default function TasksPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const qc = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'timeline' | 'graph'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Creation state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigned_agent_id: undefined,
    dependencies: [],
  });
  const [formError, setFormError] = useState<string | null>(null);

  // List projects to select from
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => projectsApi.list(companyId),
    enabled: !!companyId,
  });

  const activeProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : '');

  // List tasks for the active project
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', companyId, activeProjectId],
    queryFn: () => projectsApi.listTasks(companyId, activeProjectId),
    enabled: !!companyId && !!activeProjectId,
  });

  // List available agents for assignment
  const { data: agents = [] } = useQuery({
    queryKey: ['agents', companyId],
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (body: CreateTaskRequest) =>
      projectsApi.createTask(companyId, activeProjectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', companyId, activeProjectId] });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assigned_agent_id: undefined,
        dependencies: [],
      });
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create task.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!activeProjectId) {
      setFormError('A project must be selected to create a task.');
      return;
    }
    createMutation.mutate(form);
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground">Task Backlog & Kanban</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Autonomous Agent Orchestration
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Decomposed project tasks executed autonomously by specialized organizational AI employees
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary gap-2 self-start sm:self-auto"
          onClick={() => setShowCreate(true)}
          disabled={!activeProjectId}
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* 2. PROJECT SELECTOR, SEARCH & VIEW MODE SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground">Project:</span>
          {projects.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">No projects found</span>
          ) : (
            <select
              className="input text-xs font-semibold py-1.5 h-9 bg-secondary/50 min-w-[200px]"
              value={activeProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Filter by project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-8 text-xs h-9"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input text-xs h-9 w-auto"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
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

      {/* 3. STATUS FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
        {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED'].map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 4. LOADING & EMPTY STATES */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            {error instanceof ApiError ? error.message : 'Failed to load project tasks.'}
          </p>
        </div>
      )}

      {!isLoading && !error && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No tasks found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Add tasks to decompose project objectives into discrete agent actions.
            </p>
          </div>
          {activeProjectId && (
            <button
              type="button"
              className="btn btn-primary gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </button>
          )}
        </div>
      )}

      {/* 5. MULTI-VIEW PRESENTATION */}
      {!isLoading && filteredTasks.length > 0 && (
        <>
          {/* VIEW 1: LIST VIEW */}
          {viewMode === 'list' && (
            <div className="space-y-2.5">
              {filteredTasks.map((t) => {
                const statusConfig = STATUS_ICONS[t.status] || STATUS_ICONS.TODO;
                const priorityClass = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM;
                const assignedAgent = agents.find((a) => a.id === t.assigned_agent_id);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/60 ${statusConfig.color}`}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">{t.title}</h4>
                          <span
                            className={`inline-flex items-center rounded border px-1.5 py-0.2 text-[10px] font-medium uppercase ${priorityClass}`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        {t.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {assignedAgent ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-secondary/70 border border-border px-2.5 py-1 text-foreground">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-xs">{assignedAgent.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic text-[11px]">Unassigned</span>
                      )}
                      <span className={`badge ${statusConfig.color} bg-secondary/50 font-mono text-[10px]`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                const colTasks = filteredTasks.filter((t) => {
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

          {/* VIEW 3: TIMELINE (GANTT) VIEW */}
          {viewMode === 'timeline' && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <span className="text-xs font-semibold text-foreground block border-b border-border/60 pb-3">
                Task Execution Timeline & Precedence Schedule
              </span>
              <div className="space-y-3">
                {filteredTasks.map((t, idx) => {
                  const ag = agents.find((a) => a.id === t.assigned_agent_id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="flex items-center gap-4 text-xs cursor-pointer hover:opacity-90"
                    >
                      <div className="w-24 text-[11px] font-mono text-muted-foreground shrink-0">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : `Step ${idx + 1}`}
                      </div>
                      <div className="flex-1 bg-secondary/50 rounded-lg p-2.5 border border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{t.title}</span>
                          <span className="text-[10px] text-muted-foreground">({ag?.name || 'Unassigned'})</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          t.status === 'DONE' || t.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: DEPENDENCY GRAPH VIEW */}
          {viewMode === 'graph' && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <span className="text-xs font-semibold text-foreground block border-b border-border/60 pb-3">
                Task Dependency & Delegation Graph
              </span>
              <div className="p-6 rounded-xl bg-secondary/20 border border-border/60 flex flex-wrap gap-6 items-center justify-center">
                {filteredTasks.map((t, idx) => {
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
                      {idx < filteredTasks.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 6. TASK DETAILS DRAWER */}
      {selectedTaskId && activeProjectId && (
        <TaskDetailsDrawer
          companyId={companyId}
          projectId={activeProjectId}
          taskId={selectedTaskId}
          agents={agents}
          allTasks={tasks}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* 7. CREATION MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md glass rounded-2xl p-6 ring-1 ring-border shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-4">Create New Agent Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full text-xs"
                  placeholder="e.g. Implement zero-trust security audit parser"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Agent Metaprompt & Instructions
                </label>
                <textarea
                  rows={3}
                  className="input w-full text-xs h-auto resize-none"
                  placeholder="Provide precise scope and requirements for the assigned agent..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Priority
                  </label>
                  <select
                    className="input w-full text-xs"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Assignee Agent
                  </label>
                  <select
                    className="input w-full text-xs"
                    value={form.assigned_agent_id ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        assigned_agent_id: e.target.value || undefined,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.autonomy})
                      </option>
                    ))}
                  </select>
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
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
