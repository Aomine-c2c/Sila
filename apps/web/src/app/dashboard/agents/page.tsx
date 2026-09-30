'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Activity,
  Zap,
  Brain,
  Shield,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { agentsApi, CreateAgentRequest, Agent } from '@/lib/api/agents';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api/client';
import { AgentProfileDrawer } from '@/components/AgentProfileDrawer';

const AUTONOMY_LABELS: Record<string, string> = {
  SUPERVISED: 'Supervised',
  SEMI_AUTONOMOUS: 'Semi-Autonomous',
  AUTONOMOUS: 'Autonomous',
  FULLY_AUTONOMOUS: 'Fully Autonomous',
};

const STATUS_COLORS: Record<string, string> = {
  CREATED: 'text-muted-foreground',
  CONFIGURED: 'text-blue-400',
  AVAILABLE: 'text-green-400',
  WORKING: 'text-yellow-400',
  BLOCKED: 'text-red-400',
  PAUSED: 'text-orange-400',
  RETIRED: 'text-muted-foreground',
};

const STATUS_BG: Record<string, string> = {
  CREATED: 'bg-muted/50',
  CONFIGURED: 'bg-blue-500/10',
  AVAILABLE: 'bg-green-500/10',
  WORKING: 'bg-yellow-500/10',
  BLOCKED: 'bg-red-500/10',
  PAUSED: 'bg-orange-500/10',
  RETIRED: 'bg-muted/30',
};

const AUTONOMY_COLORS: Record<string, string> = {
  SUPERVISED: 'badge-default',
  SEMI_AUTONOMOUS: 'badge-primary',
  AUTONOMOUS: 'badge-warning',
  FULLY_AUTONOMOUS: 'badge-destructive',
};

function AgentCard({ agent, onSelect }: { agent: Agent; onSelect: () => void }) {
  const statusColor = STATUS_COLORS[agent.status] ?? 'text-muted-foreground';
  const statusBg = STATUS_BG[agent.status] ?? 'bg-muted/50';
  const autonomyClass = AUTONOMY_COLORS[agent.autonomy] ?? 'badge-default';

  return (
    <div
      onClick={onSelect}
      className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusBg}`}>
          <Bot className={`h-5 w-5 ${statusColor}`} aria-hidden="true" />
        </div>
        <span className={`badge ${autonomyClass}`}>
          {AUTONOMY_LABELS[agent.autonomy] ?? agent.autonomy}
        </span>
      </div>

      {/* Name & status */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {agent.name}
          </h3>
          <Circle className={`h-2 w-2 fill-current ${statusColor} flex-shrink-0`} aria-hidden="true" />
        </div>
        <p className={`text-xs font-medium mt-0.5 ${statusColor}`}>{agent.status}</p>
      </div>

      {/* Instructions preview */}
      {agent.system_instructions && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {agent.system_instructions}
        </p>
      )}

      {/* Capabilities */}
      {agent.capabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 4).map((cap) => (
            <span
              key={cap}
              className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 4 && (
            <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground">
              +{agent.capabilities.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer metrics */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{(agent.performance_metadata as { tasks_completed?: number })?.tasks_completed ?? 0} tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          <span>${((agent.resource_usage as { total_cost_usd?: number })?.total_cost_usd ?? 0).toFixed(4)}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="ml-auto flex items-center gap-1 text-primary hover:underline font-semibold"
          aria-label={`View ${agent.name} profile`}
        >
          Profile
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const qc = useQueryClient();
  const { activeCompany } = useAuthStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateAgentRequest>({
    name: '',
    system_instructions: '',
    responsibilities: [],
    goals: [],
    capabilities: [],
    autonomy: 'SUPERVISED',
  });
  const [capInput, setCapInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const companyId = activeCompany?.id;

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents', companyId],
    queryFn: () => agentsApi.list(companyId!),
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateAgentRequest) => agentsApi.create(companyId!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents', companyId] });
      setShowCreate(false);
      setForm({ name: '', system_instructions: '', responsibilities: [], goals: [], capabilities: [], autonomy: 'SUPERVISED' });
      setCapInput('');
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create agent.');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { setFormError('Agent name is required.'); return; }
    setFormError(null);
    createMutation.mutate(form);
  };

  const addCapability = () => {
    const cap = capInput.trim();
    if (!cap) return;
    setForm((f) => ({ ...f, capabilities: [...(f.capabilities ?? []), cap] }));
    setCapInput('');
  };

  const removeCapability = (cap: string) => {
    setForm((f) => ({ ...f, capabilities: (f.capabilities ?? []).filter((c) => c !== cap) }));
  };

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.system_instructions ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20">
        <Shield className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">No active organization</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select an organization first to manage its agents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Workforce</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organizational agents — your AI employees
          </p>
        </div>
        <button
          id="create-agent-btn"
          type="button"
          className="btn btn-primary shrink-0 gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Agent
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          className="input pl-9"
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search agents"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: agents.length, color: 'text-foreground', icon: Bot },
          { label: 'Available', value: agents.filter(a => a.status === 'AVAILABLE').length, color: 'text-green-400', icon: Activity },
          { label: 'Working', value: agents.filter(a => a.status === 'WORKING').length, color: 'text-yellow-400', icon: Zap },
          { label: 'Blocked', value: agents.filter(a => a.status === 'BLOCKED').length, color: 'text-red-400', icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Loading/Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading agents" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error instanceof ApiError ? error.message : 'Failed to load agents.'}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No agents yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first AI employee to start automating work.
            </p>
          </div>
          <button type="button" className="btn btn-primary gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>
      )}

      {/* Agent grid */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={() => setSelectedAgentId(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Agent Profile & Operations Drawer */}
      {selectedAgentId && companyId && (
        <AgentProfileDrawer
          companyId={companyId}
          agentId={selectedAgentId}
          allAgents={agents.map((a) => ({ id: a.id, name: a.name }))}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-agent-title"
        >
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 id="create-agent-title" className="text-lg font-semibold text-foreground mb-4">
              Create AI Agent
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="agent-name" className="mb-1.5 block text-sm font-medium text-foreground">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="agent-name"
                  type="text"
                  className="input"
                  placeholder="e.g. Engineering Lead"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="agent-instructions" className="mb-1.5 block text-sm font-medium text-foreground">
                  System Instructions
                </label>
                <textarea
                  id="agent-instructions"
                  rows={4}
                  className="input h-auto resize-none"
                  placeholder="You are a senior engineering lead responsible for…"
                  value={form.system_instructions ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, system_instructions: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="agent-autonomy" className="mb-1.5 block text-sm font-medium text-foreground">
                  Autonomy Level
                </label>
                <select
                  id="agent-autonomy"
                  className="input"
                  value={form.autonomy ?? 'SUPERVISED'}
                  onChange={(e) => setForm((f) => ({ ...f, autonomy: e.target.value }))}
                >
                  <option value="SUPERVISED">Supervised — every action approved</option>
                  <option value="SEMI_AUTONOMOUS">Semi-Autonomous — low-risk actions auto</option>
                  <option value="AUTONOMOUS">Autonomous — within policy</option>
                  <option value="FULLY_AUTONOMOUS">Fully Autonomous — adaptive</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Capabilities
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="e.g. code_review"
                    value={capInput}
                    onChange={(e) => setCapInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCapability(); }}}
                  />
                  <button
                    type="button"
                    className="btn btn-outline shrink-0"
                    onClick={addCapability}
                  >
                    Add
                  </button>
                </div>
                {(form.capabilities ?? []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(form.capabilities ?? []).map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        onClick={() => removeCapability(cap)}
                        title="Click to remove"
                      >
                        {cap} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => { setShowCreate(false); setFormError(null); }}
                >
                  Cancel
                </button>
                <button
                  id="create-agent-submit"
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create Agent'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
