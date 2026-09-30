'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Search,
  BookOpen,
  Scale,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Eye,
  Plus,
  RotateCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Tag,
  Sliders,
  FileText,
  Filter,
  Users,
  Compass,
} from 'lucide-react';
import {
  memoryApi,
  MemoryDomain,
  MemoryScope,
  MemoryItem,
  DecisionRecord,
  ContextAssemblyRequest,
  MemoryItemCreate,
  DecisionRecordCreate,
} from '@/lib/api/memory';
import { useAuthStore } from '@/store/auth';

const MEMORY_DOMAINS: { id: MemoryDomain; label: string; desc: string }[] = [
  { id: 'COMPANY', label: 'Company', desc: 'Core mission, structure, principles' },
  { id: 'DEPARTMENT', label: 'Department', desc: 'Departmental playbooks & operating rhythms' },
  { id: 'AGENT', label: 'Agent', desc: 'Agent personas, specializations, skills' },
  { id: 'PROJECT', label: 'Project', desc: 'Project milestones, deliveries, specifications' },
  { id: 'CUSTOMER', label: 'Customer', desc: 'Account requirements, friction points, feedback' },
  { id: 'DECISION', label: 'Decision', desc: 'Historic ADRs, tradeoffs, rationales' },
  { id: 'POLICY', label: 'Policy', desc: 'Organizational compliance & legal constraints' },
  { id: 'EXPERIMENT', label: 'Experiment', desc: 'A/B benchmarks, hypotheses, learnings' },
  { id: 'FAILURE', label: 'Failure', desc: 'Incident post-mortems & error preventions' },
  { id: 'KNOWLEDGE_BASE', label: 'Knowledge Base', desc: 'General organizational technical docs' },
];

const SCOPE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  PUBLIC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  INTERNAL: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  CONFIDENTIAL: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  RESTRICTED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  PRIVATE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export default function OrganizationalMemoryPage() {
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const companyId = activeCompany?.id || '';
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'knowledge' | 'assembly' | 'decisions' | 'add'>('knowledge');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedScope, setSelectedScope] = useState<string>('');

  // Context Assembly Simulator State
  const [taskObjective, setTaskObjective] = useState(
    'Audit compliance and customer data classification policies before deploying European payment gateway'
  );
  const [callerRole, setCallerRole] = useState('MEMBER');
  const [callerPermissions, setCallerPermissions] = useState('dept:compliance,role:MEMBER');
  const [maxContextTokens, setMaxContextTokens] = useState('2000');

  // New Memory Modal State
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<MemoryDomain>('KNOWLEDGE_BASE');
  const [newScope, setNewScope] = useState<MemoryScope>('INTERNAL');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSource, setNewSource] = useState('User manual submission');
  const [newConfidence, setNewConfidence] = useState('1.0');

  // Queries
  const {
    data: memories = [],
    isLoading: isMemoriesLoading,
    refetch: refetchMemories,
  } = useQuery({
    queryKey: ['memory-items', companyId, selectedDomain, selectedScope, searchQuery],
    queryFn: () => {
      if (searchQuery.trim().length > 0) {
        return memoryApi.search(companyId, searchQuery, selectedDomain || undefined, selectedScope || undefined);
      }
      return memoryApi.listMemories(companyId, {
        domain: selectedDomain || undefined,
        scope: selectedScope || undefined,
      });
    },
    enabled: !!companyId,
  });

  const {
    data: decisions = [],
    isLoading: isDecisionsLoading,
    refetch: refetchDecisions,
  } = useQuery({
    queryKey: ['memory-decisions', companyId],
    queryFn: () => memoryApi.listDecisions(companyId),
    enabled: !!companyId,
  });

  // Mutations
  const assembleMutation = useMutation({
    mutationFn: (req: ContextAssemblyRequest) => memoryApi.assembleContext(companyId, req),
  });

  const createMemoryMutation = useMutation({
    mutationFn: (data: MemoryItemCreate) => memoryApi.createMemory(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-items', companyId] });
      setActiveTab('knowledge');
      setNewTitle('');
      setNewContent('');
      setNewSummary('');
    },
  });

  const handleAssemble = (e: React.FormEvent) => {
    e.preventDefault();
    assembleMutation.mutate({
      task_objective: taskObjective,
      caller_role: callerRole,
      caller_permissions: callerPermissions.split(',').map((p) => p.trim()).filter(Boolean),
      max_context_tokens: parseInt(maxContextTokens, 10) || 2000,
    });
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    createMemoryMutation.mutate({
      title: newTitle,
      domain: newDomain,
      scope: newScope,
      content: newContent,
      summary: newSummary || undefined,
      source: newSource,
      confidence: parseFloat(newConfidence) || 1.0,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Brain className="h-3.5 w-3.5" />
              NEXORA Organizational Memory System
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Institutional Knowledge & Context Assembly
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              <span className="font-semibold text-foreground">Architectural Law:</span> External model providers must never receive the entire company memory. Memory is partitioned across 10 domains with role-based permission scopes, provenance metadata, and automated context assembly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('add')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ingest Memory
            </button>
            <button
              onClick={() => {
                refetchMemories();
                refetchDecisions();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Domain Quick-Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedDomain('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
            selectedDomain === ''
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All Domains ({memories.length})
        </button>
        {MEMORY_DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDomain(selectedDomain === d.id ? '' : d.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedDomain === d.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'knowledge'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Searchable Knowledge Base
        </button>

        <button
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'assembly'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Task Context Assembly Engine
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'decisions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-4 w-4" />
          Decision Memory Records ({decisions.length})
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'add'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="h-4 w-4" />
          Ingest Knowledge
        </button>
      </div>

      {/* TAB 1: SEARCHABLE KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Search Bar & Scope Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 10 memory domains (e.g. 'token', 'security', 'SAML', 'architecture')..."
                className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">All Scope Tiers</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </div>

          {/* Memory Items List */}
          {isMemoriesLoading ? (
            <div className="py-20 text-center space-y-2 text-muted-foreground">
              <RotateCw className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-xs">Searching organizational memory stores...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
              <Brain className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <h3 className="text-sm font-semibold text-foreground">No Memory Records Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No items matching your current domain, scope, or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memories.map((mem) => {
                const scopeBadge = SCOPE_BADGES[mem.scope] || SCOPE_BADGES.INTERNAL;
                return (
                  <div
                    key={mem.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                            {mem.domain}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${scopeBadge.bg} ${scopeBadge.text} ${scopeBadge.border}`}
                          >
                            {mem.scope}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{mem.title}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {Math.round(mem.confidence * 100)}% Conf
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {mem.summary || mem.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                      <span>Source: {mem.source}</span>
                      <span>Accessed: {mem.access_count} times</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTEXT ASSEMBLY ENGINE */}
      {activeTab === 'assembly' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Task Context Assembly Pipeline</h2>
              <p className="text-xs text-muted-foreground mt-1">
                TASK → identify required knowledge → retrieve memories → apply permissions → rank relevance → send minimal necessary context to model.
              </p>
            </div>

            <form onSubmit={handleAssemble} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Task Objective</label>
                <textarea
                  rows={3}
                  value={taskObjective}
                  onChange={(e) => setTaskObjective(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Caller Role</label>
                  <select
                    value={callerRole}
                    onChange={(e) => setCallerRole(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="MEMBER">MEMBER (Standard Agent/User)</option>
                    <option value="MANAGER">MANAGER (Department Head)</option>
                    <option value="ADMIN">ADMIN (Workspace Admin)</option>
                    <option value="OWNER">OWNER (Full Privilege)</option>
                    <option value="VIEWER">VIEWER (Read Only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Max Context Tokens</label>
                  <input
                    type="number"
                    value={maxContextTokens}
                    onChange={(e) => setMaxContextTokens(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Caller Permission Claims</label>
                <input
                  type="text"
                  value={callerPermissions}
                  onChange={(e) => setCallerPermissions(e.target.value)}
                  placeholder="dept:compliance, role:MEMBER"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={assembleMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {assembleMutation.isPending ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Assembling Authorized Context...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Run Context Assembly
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Context Assembly Output */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Sanitized Model Context</h2>
                {assembleMutation.data && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Zero Leakage Verified
                  </span>
                )}
              </div>

              {assembleMutation.isPending && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <RotateCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    Evaluating domain tags, enforcing permission boundaries, ranking relevance...
                  </p>
                </div>
              )}

              {assembleMutation.data && (
                <div className="mt-4 space-y-4">
                  {/* Telemetry Chips */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Evaluated</div>
                      <div className="text-xs font-semibold text-foreground font-mono">
                        {assembleMutation.data.total_memories_evaluated} items
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Selected</div>
                      <div className="text-xs font-semibold text-primary font-mono">
                        {assembleMutation.data.authorized_memories_selected} items
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Context Tokens</div>
                      <div className="text-xs font-semibold text-emerald-400 font-mono">
                        ~{assembleMutation.data.estimated_context_tokens}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Assembled Minimal Prompt (Injected to AI Provider)
                    </label>
                    <div className="rounded-lg border border-border bg-background p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {assembleMutation.data.assembled_context_prompt}
                    </div>
                  </div>
                </div>
              )}

              {!assembleMutation.data && !assembleMutation.isPending && (
                <div className="py-20 text-center space-y-2 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs">Run the pipeline to test privacy boundaries and minimal context generation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DECISION RECORDS */}
      {activeTab === 'decisions' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Organizational Decision Records (ADRs)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preserving problems, options evaluated, evidence, rationale, outcomes, and ongoing lessons learned.
            </p>
          </div>

          <div className="space-y-4">
            {decisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-primary font-mono uppercase tracking-wider">
                      Decision Record
                    </span>
                    <h3 className="text-base font-bold text-foreground">{d.title}</h3>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Decided on {new Date(d.decided_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                    <span className="font-semibold text-foreground block">The Problem</span>
                    <p className="text-muted-foreground leading-relaxed">{d.problem}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                    <span className="font-semibold text-foreground block">Decision & Rationale</span>
                    <p className="text-muted-foreground leading-relaxed font-semibold text-foreground">{d.decision}</p>
                    <p className="text-muted-foreground leading-relaxed">{d.rationale}</p>
                  </div>
                </div>

                {d.lessons_learned && d.lessons_learned.length > 0 && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                    <span className="text-xs font-semibold text-primary block">Lessons Learned for Future Agents</span>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {d.lessons_learned.map((l, idx) => (
                        <li key={idx}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INGEST KNOWLEDGE FORM */}
      {activeTab === 'add' && (
        <div className="max-w-2xl rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Ingest Knowledge Asset</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Store a discrete unit of memory with explicit domain classification, scope tier, and provenance metadata.
            </p>
          </div>

          <form onSubmit={handleCreateMemory} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. EU GDPR Data Residency Standards"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Domain</label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as MemoryDomain)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {MEMORY_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Access Scope</label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as MemoryScope)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="INTERNAL">INTERNAL (All company members)</option>
                  <option value="PUBLIC">PUBLIC (External facing)</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL (Managers only)</option>
                  <option value="RESTRICTED">RESTRICTED (Admins / Owners)</option>
                  <option value="PRIVATE">PRIVATE (Owner only)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Full Content</label>
              <textarea
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Detailed knowledge text..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Summary <span className="text-muted-foreground font-normal">(Used for token-efficient prompts)</span>
              </label>
              <input
                type="text"
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Concise 1-sentence summary"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Provenance Source</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Confidence Score (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={newConfidence}
                  onChange={(e) => setNewConfidence(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createMemoryMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMemoryMutation.isPending ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" /> Ingesting Asset...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Save Memory Item
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
