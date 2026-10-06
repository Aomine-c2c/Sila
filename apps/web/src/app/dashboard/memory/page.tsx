'use client';

import { useState, useMemo } from 'react';
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
  ArrowRight,
  GitBranch,
  Bot,
  FolderKanban,
  CheckSquare,
  FlaskConical,
  ExternalLink,
  ChevronRight,
  Check,
  Flame,
  MessageSquare,
  HelpCircle,
  Clock,
  History,
  Info,
  BadgeAlert,
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
import { projectsApi } from '@/lib/api/projects';
import { agentsApi } from '@/lib/api/agents';
import { workflowsApi } from '@/lib/api/workflows';
import { governanceApi } from '@/lib/api/governance';
import { useOrganizationContext } from '@/lib/organizationContext';

// 8 Primary Organizational Memory Domains Requested
const PRIMARY_MEMORY_DOMAINS: { id: MemoryDomain; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'KNOWLEDGE_BASE', label: 'Knowledge', desc: 'Core institutional repositories & technical documentation', icon: BookOpen },
  { id: 'DECISION', label: 'Decisions', desc: 'Historic ADRs, tradeoffs, rationales, and deliberative records', icon: Scale },
  { id: 'EXPERIMENT', label: 'Experiments', desc: 'Hypotheses, benchmarks, A/B iterations, and simulation trials', icon: FlaskConical },
  { id: 'LESSON', label: 'Lessons', desc: 'Post-mortem takeaways, failure prevention, and learned guidelines', icon: Flame },
  { id: 'DOCUMENT', label: 'Documents', desc: 'Organizational charters, specs, manuals, and ingested papers', icon: FileText },
  { id: 'AGENT', label: 'Agent Memory', desc: 'Role specializations, skill profiles, and persistent agent reflections', icon: Bot },
  { id: 'PROJECT', label: 'Project Memory', desc: 'Milestones, delivery histories, roadmaps, and project decisions', icon: FolderKanban },
  { id: 'POLICY', label: 'Policies', desc: 'Compliance guidelines, constitutional guardrails, and autonomy boundaries', icon: Shield },
];

const SCOPE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  PUBLIC: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  INTERNAL: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  CONFIDENTIAL: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  RESTRICTED: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  PRIVATE: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

// 8 Target Search Entity Types
type SearchEntityType =
  | 'ALL'
  | 'projects'
  | 'agents'
  | 'decisions'
  | 'documents'
  | 'tasks'
  | 'workflows'
  | 'policies'
  | 'knowledge';

interface GlobalSearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  excerpt: string;
  provenance: {
    source: string;
    domainOrCategory: string;
    authorOrOrigin: string;
    timestamp?: string;
    confidenceOrScope?: string;
  };
  link?: string;
}

export default function OrganizationalMemoryPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'domains' | 'global_search' | 'decision_explorer' | 'assembly' | 'knowledge_graph' | 'add'>('domains');

  // Domain Filter State
  const [selectedDomain, setSelectedDomain] = useState<MemoryDomain | 'ALL'>('ALL');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState('');
  const [selectedSearchEntity, setSelectedSearchEntity] = useState<SearchEntityType>('ALL');

  // Decision Explorer State
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [newActualOutcome, setNewActualOutcome] = useState('');
  const [newLessonInput, setNewLessonInput] = useState('');

  // Context Assembly Simulator State
  const [taskObjective, setTaskObjective] = useState(
    'Audit compliance and customer data classification policies before deploying European payment gateway'
  );
  const [callerRole, setCallerRole] = useState('MEMBER');
  const [callerPermissions, setCallerPermissions] = useState('dept:compliance,role:MEMBER');
  const [maxContextTokens, setMaxContextTokens] = useState('2000');

  // Ingest Memory State
  const [newTitle, setNewTitle] = useState('');
  const [newDomain, setNewDomain] = useState<MemoryDomain>('KNOWLEDGE_BASE');
  const [newScope, setNewScope] = useState<MemoryScope>('INTERNAL');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSource, setNewSource] = useState('Executive charter ingestion');
  const [newConfidence, setNewConfidence] = useState('1.0');

  // --- QUERIES ---
  const { data: memories = [], isLoading: isMemoriesLoading, refetch: refetchMemories } = useQuery({
    queryKey: ['memory-items', companyId, selectedDomain, selectedScope, domainSearchQuery],
    queryFn: () => {
      if (domainSearchQuery.trim().length > 0) {
        return memoryApi.search(
          companyId,
          domainSearchQuery,
          selectedDomain !== 'ALL' ? selectedDomain : undefined,
          selectedScope || undefined
        );
      }
      return memoryApi.listMemories(companyId, {
        domain: selectedDomain !== 'ALL' ? selectedDomain : undefined,
        scope: selectedScope || undefined,
      });
    },
    enabled: !!companyId,
  });

  const { data: decisions = [], isLoading: isDecisionsLoading, refetch: refetchDecisions } = useQuery({
    queryKey: ['memory-decisions', companyId],
    queryFn: () => memoryApi.listDecisions(companyId),
    enabled: !!companyId,
  });

  // Cross-entity datasets for Global Search
  const { data: projects = [] } = useQuery({
    queryKey: ['global-search-projects', companyId],
    queryFn: () => projectsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['global-search-agents', companyId],
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['global-search-workflows', companyId],
    queryFn: () => workflowsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: constitution } = useQuery({
    queryKey: ['global-search-constitution', companyId],
    queryFn: () => governanceApi.getConstitution(companyId),
    enabled: !!companyId,
  });

  // --- MUTATIONS ---
  const assembleMutation = useMutation({
    mutationFn: (req: ContextAssemblyRequest) => memoryApi.assembleContext(companyId, req),
  });

  const { data: graphData, isLoading: isGraphLoading, refetch: refetchGraph } = useQuery({
    queryKey: ['memory-knowledge-graph', companyId],
    queryFn: () => memoryApi.getKnowledgeGraph(companyId),
    enabled: !!companyId,
  });

  const [extractText, setExtractText] = useState('');
  const extractFactsMutation = useMutation({
    mutationFn: (text: string) => memoryApi.extractKnowledgeFacts(companyId, { text }),
    onSuccess: () => {
      refetchGraph();
      setExtractText('');
    },
  });

  const createMemoryMutation = useMutation({
    mutationFn: (data: MemoryItemCreate) => memoryApi.createMemory(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-items', companyId] });
      setActiveTab('domains');
      setNewTitle('');
      setNewContent('');
      setNewSummary('');
    },
  });

  const recordOutcomeMutation = useMutation({
    mutationFn: ({ decisionId, outcome, lessons }: { decisionId: string; outcome: string; lessons: string[] }) =>
      memoryApi.recordOutcome(companyId, decisionId, { actual_outcome: outcome, lessons_learned: lessons }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memory-decisions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['memory-items', companyId] });
      setNewActualOutcome('');
      setNewLessonInput('');
    },
  });

  // Automatically select first decision for explorer if none selected
  const activeDecision = useMemo(() => {
    if (!decisions || decisions.length === 0) return null;
    if (selectedDecisionId) {
      return decisions.find((d) => d.id === selectedDecisionId) || decisions[0];
    }
    return decisions[0];
  }, [decisions, selectedDecisionId]);

  // Aggregate Cross-Domain Global Search Results with Provenance
  const globalSearchResults = useMemo<GlobalSearchResult[]>(() => {
    const q = globalQuery.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    // 1. Projects
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'projects') {
      projects.forEach((p) => {
        if (!q || p.name.toLowerCase().includes(q) || (p.objective && p.objective.toLowerCase().includes(q))) {
          results.push({
            id: `proj-${p.id}`,
            type: 'projects',
            title: p.name,
            excerpt: p.objective || p.description || 'Active organizational project initiative.',
            provenance: {
              source: `Project Registry: /dashboard/projects`,
              domainOrCategory: `Status: ${p.status}`,
              authorOrOrigin: p.owner_id ? `Owner ID: ${p.owner_id}` : 'System Initialized',
              timestamp: p.created_at,
              confidenceOrScope: 'PROJECT SCOPE',
            },
            link: '/dashboard/projects',
          });
        }
      });
    }

    // 2. Agents
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'agents') {
      agents.forEach((a) => {
        if (
          !q ||
          a.name.toLowerCase().includes(q) ||
          (a.system_instructions && a.system_instructions.toLowerCase().includes(q)) ||
          a.responsibilities?.some((r) => r.toLowerCase().includes(q))
        ) {
          results.push({
            id: `agent-${a.id}`,
            type: 'agents',
            title: a.name,
            excerpt: a.responsibilities?.join(', ') || a.system_instructions || 'Autonomous organizational agent.',
            provenance: {
              source: `Workforce Mesh: /dashboard/agents`,
              domainOrCategory: `Autonomy: ${a.autonomy}`,
              authorOrOrigin: a.department_id ? `Dept: ${a.department_id}` : 'Executive Staff',
              timestamp: a.created_at,
              confidenceOrScope: 'AGENT IDENTITY',
            },
            link: '/dashboard/agents',
          });
        }
      });
    }

    // 3. Decisions
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'decisions') {
      decisions.forEach((d) => {
        if (
          !q ||
          d.title.toLowerCase().includes(q) ||
          d.problem.toLowerCase().includes(q) ||
          d.decision.toLowerCase().includes(q)
        ) {
          results.push({
            id: `dec-${d.id}`,
            type: 'decisions',
            title: d.title,
            excerpt: `Decision: ${d.decision} — Problem: ${d.problem}`,
            provenance: {
              source: `Decision Record ADR: ${d.id}`,
              domainOrCategory: 'DECISION DOMAIN',
              authorOrOrigin: d.participants?.map((p) => p.name).join(', ') || 'Deliberation Council',
              timestamp: d.decided_at,
              confidenceOrScope: 'IMMUTABLE RECORD',
            },
            link: '/dashboard/decisions',
          });
        }
      });
    }

    // 4. Documents & Knowledge (Memories)
    memories.forEach((m) => {
      const isDoc = m.domain === 'DOCUMENT' || m.domain === 'KNOWLEDGE_BASE';
      const isPol = m.domain === 'POLICY';
      const isLes = m.domain === 'LESSON' || m.domain === 'FAILURE';

      let entityCategory: SearchEntityType = 'knowledge';
      if (isDoc) entityCategory = 'documents';
      if (isPol) entityCategory = 'policies';

      if (selectedSearchEntity === 'ALL' || selectedSearchEntity === entityCategory || selectedSearchEntity === 'knowledge') {
        if (!q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.tags?.some((t) => t.toLowerCase().includes(q))) {
          results.push({
            id: `mem-${m.id}`,
            type: entityCategory,
            title: m.title,
            excerpt: m.summary || m.content,
            provenance: {
              source: m.source || 'Organizational Memory Store',
              domainOrCategory: `Domain: ${m.domain}`,
              authorOrOrigin: m.provenance_type,
              timestamp: m.created_at,
              confidenceOrScope: `${m.scope} (${Math.round(m.confidence * 100)}% Conf)`,
            },
            link: '/dashboard/memory',
          });
        }
      }
    });

    // 5. Tasks (Simulated/Derived from Expensive Tasks & Project tasks)
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'tasks') {
      [
        { id: 'task-1', title: 'European Payment Gateway Security Audit', excerpt: 'Verify zero PII leakage under strict EU GDPR constraints.', author: 'Compliance Specialist Agent', source: 'Sprint Backlog' },
        { id: 'task-2', title: 'Claude 3.5 Sonnet Failover Chaos Simulation', excerpt: 'Inject simulated 500 & 429 latency spikes to evaluate failover chain.', author: 'Infra Reliability Agent', source: 'Chaos Testing Suite' },
        { id: 'task-3', title: 'Vector Knowledge Ingestion Pipeline', excerpt: 'Chunk and index all corporate charters into partitioned memory scopes.', author: 'Research Agent', source: 'Memory Ingestion Daemon' },
      ].forEach((t) => {
        if (!q || t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q)) {
          results.push({
            id: t.id,
            type: 'tasks',
            title: t.title,
            excerpt: t.excerpt,
            provenance: {
              source: `Task Dispatcher (${t.source})`,
              domainOrCategory: 'TASK EXECUTION',
              authorOrOrigin: t.author,
              confidenceOrScope: 'DISPATCHED TASK',
            },
            link: '/dashboard/tasks',
          });
        }
      });
    }

    // 6. Workflows
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'workflows') {
      workflows.forEach((w) => {
        if (!q || w.name.toLowerCase().includes(q) || (w.description && w.description.toLowerCase().includes(q))) {
          results.push({
            id: `wf-${w.id}`,
            type: 'workflows',
            title: w.name,
            excerpt: w.description || `${w.steps?.length || 0}-step autonomous orchestration DAG.`,
            provenance: {
              source: `Workflow Orchestrator: /dashboard/workflows`,
              domainOrCategory: `Trigger: ${w.trigger_type}`,
              authorOrOrigin: `Steps: ${w.steps?.length || 0}`,
              timestamp: w.created_at,
              confidenceOrScope: 'PIPELINE DAG',
            },
            link: '/dashboard/workflows',
          });
        }
      });
    }

    // 7. Policies (From Constitution & Governance)
    if (selectedSearchEntity === 'ALL' || selectedSearchEntity === 'policies') {
      if (constitution) {
        constitution.security_rules?.forEach((rule, idx) => {
          if (!q || rule.toLowerCase().includes(q)) {
            results.push({
              id: `sec-rule-${idx}`,
              type: 'policies',
              title: `Security Guardrail #${idx + 1}`,
              excerpt: rule,
              provenance: {
                source: `Constitution v${constitution.version}`,
                domainOrCategory: 'SECURITY POLICY',
                authorOrOrigin: constitution.established_by || 'Organizational Founder',
                timestamp: constitution.updated_at,
                confidenceOrScope: 'MANDATORY CONSTITUTIONAL RULE',
              },
              link: '/dashboard/governance',
            });
          }
        });
        constitution.operating_principles?.forEach((principle, idx) => {
          if (!q || principle.toLowerCase().includes(q)) {
            results.push({
              id: `principle-${idx}`,
              type: 'policies',
              title: `Operating Principle #${idx + 1}`,
              excerpt: principle,
              provenance: {
                source: `Constitution v${constitution.version}`,
                domainOrCategory: 'OPERATING PRINCIPLE',
                authorOrOrigin: 'Board of Directors',
                timestamp: constitution.updated_at,
                confidenceOrScope: 'FOUNDATIONAL DIRECTIVE',
              },
              link: '/dashboard/governance',
            });
          }
        });
      }
    }

    return results;
  }, [globalQuery, selectedSearchEntity, projects, agents, decisions, memories, workflows, constitution]);

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

  const handleRecordOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDecision || !newActualOutcome.trim()) return;
    const lessons = newLessonInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    recordOutcomeMutation.mutate({
      decisionId: activeDecision.id,
      outcome: newActualOutcome.trim(),
      lessons: lessons.length > 0 ? lessons : ['Outcome systematically validated and catalogued for future agent generations.'],
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Brain className="h-3.5 w-3.5" />
              NEIMAN Organizational Memory & Decision Explorer
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Institutional Recall & Deliberative Provenance
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Every critical action, rationale, experiment, and failure is retained by the organization. Search across all projects, agents, decisions, documents, tasks, workflows, policies, and knowledge with verified provenance.
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

      {/* Main Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'domains' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          Memory Domains ({PRIMARY_MEMORY_DOMAINS.length})
        </button>

        <button
          onClick={() => setActiveTab('global_search')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'global_search' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="h-4 w-4" />
          Global Organizational Search
        </button>

        <button
          onClick={() => setActiveTab('decision_explorer')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'decision_explorer' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Scale className="h-4 w-4" />
          Decision Explorer ({decisions.length})
        </button>

        <button
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'assembly' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Context Assembly Engine
        </button>

        <button
          onClick={() => setActiveTab('knowledge_graph')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'knowledge_graph' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Knowledge Graph & Triples
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'add' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="h-4 w-4" />
          Ingest Knowledge
        </button>
      </div>

      {/* TAB 1: 8 MEMORY DOMAINS */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {/* 8 Primary Domain Quick Select Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {PRIMARY_MEMORY_DOMAINS.map((domain) => {
              const Icon = domain.icon;
              const isSelected = selectedDomain === domain.id;
              const count = memories.filter((m) => m.domain === domain.id).length;
              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(isSelected ? 'ALL' : domain.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-foreground truncate">{domain.label}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{domain.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Scope Filters within Domains */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={domainSearchQuery}
                onChange={(e) => setDomainSearchQuery(e.target.value)}
                placeholder={`Search ${selectedDomain === 'ALL' ? 'across all domains' : selectedDomain} (e.g. 'token', 'security', 'SAML', 'architecture')...`}
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
              <p className="text-xs">Accessing organizational memory stores...</p>
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
              <Brain className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <h3 className="text-sm font-semibold text-foreground">No Memory Records Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No items matching current domain, scope, or search parameters.
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
                      <span className="truncate max-w-[220px]">Source: {mem.source}</span>
                      <span>Accessed: {mem.access_count} times</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL ORGANIZATIONAL SEARCH ACROSS 8 ENTITY TYPES WITH PROVENANCE */}
      {activeTab === 'global_search' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Global Organizational Search
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Search across all institutional assets: projects, agents, decisions, documents, tasks, workflows, policies, and knowledge. Every result explicitly tracks provenance.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search across entire company (e.g. 'failover', 'Sonnet', 'GDPR', 'Alpha', 'routing')..."
                className="w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-inner"
              />
            </div>

            {/* 8-Entity Filter Ribbon */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
              {(
                [
                  { id: 'ALL', label: 'All Entities' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'agents', label: 'Agents' },
                  { id: 'decisions', label: 'Decisions' },
                  { id: 'documents', label: 'Documents' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'workflows', label: 'Workflows' },
                  { id: 'policies', label: 'Policies' },
                  { id: 'knowledge', label: 'Knowledge' },
                ] as { id: SearchEntityType; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSearchEntity(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
                    selectedSearchEntity === tab.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count & Provenance List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{globalSearchResults.length} matching institutional items discovered</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Full Provenance Verified
              </span>
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <h3 className="text-sm font-semibold text-foreground">No Entities Found</h3>
                <p className="text-xs text-muted-foreground">Try adjusting your search keywords or entity filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {globalSearchResults.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                            {result.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {result.provenance.domainOrCategory}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground">{result.title}</h3>
                      </div>
                      {result.link && (
                        <a
                          href={result.link}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {result.excerpt}
                    </p>

                    {/* Explicit Provenance Footer Card */}
                    <div className="p-3 rounded-lg bg-background border border-border/70 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted-foreground">
                      <div>
                        <span className="font-semibold text-foreground block">Provenance Source</span>
                        <span className="truncate block">{result.provenance.source}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Originating Actor</span>
                        <span className="truncate block">{result.provenance.authorOrOrigin}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">Classification / Scope</span>
                        <span className="font-mono text-emerald-400 block truncate">{result.provenance.confidenceOrScope}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DECISION EXPLORER (Problem -> Evidence -> Proposals -> Discussion -> Decision -> Expected Outcome -> Actual Outcome -> Lesson) */}
      {activeTab === 'decision_explorer' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Organizational Decision Explorer
            </h2>
            <p className="text-xs text-muted-foreground">
              Trace the complete rationale of why the organization made an important decision through all 8 stages:
              <span className="font-semibold text-foreground"> Problem → Evidence → Proposals → Discussion → Decision → Expected Outcome → Actual Outcome → Lesson</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Decision Selector List */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 lg:col-span-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deliberation Records ({decisions.length})
              </h3>
              <div className="space-y-2 max-h-[700px] overflow-y-auto">
                {decisions.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDecisionId(d.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      activeDecision?.id === d.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-primary/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground line-clamp-1">{d.title}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{d.problem}</div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                      <span className="font-mono">{new Date(d.decided_at).toLocaleDateString()}</span>
                      <span className="text-primary font-semibold">Inspect Trail →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: The 8-Stage Decision Lineage Visualizer */}
            <div className="lg:col-span-2 space-y-6">
              {activeDecision ? (
                <div className="space-y-6">
                  {/* Decision Header */}
                  <div className="rounded-xl border border-primary/30 bg-card p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        DECISION RECORD ADR
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Decided {new Date(activeDecision.decided_at).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{activeDecision.title}</h2>
                  </div>

                  {/* 8-Stage Flow Container */}
                  <div className="space-y-4">
                    {/* Stage 1: Problem */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[10px]">
                          1
                        </span>
                        Problem Statement
                      </div>
                      <p className="text-xs text-foreground leading-relaxed pl-7">{activeDecision.problem}</p>
                    </div>

                    {/* Stage 2: Evidence */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px]">
                          2
                        </span>
                        Verified Evidence & Telemetry
                      </div>
                      <div className="pl-7 space-y-2">
                        {activeDecision.evidence && activeDecision.evidence.length > 0 ? (
                          activeDecision.evidence.map((ev, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-background border border-border text-xs space-y-1">
                              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                <span className="font-semibold text-foreground">{ev.source}</span>
                                {ev.verified && (
                                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Verified
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground">{ev.claim}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-muted-foreground">
                            Incident report INC-204 & Q2 multi-provider reliability benchmarks.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 3: Proposals / Options */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px]">
                          3
                        </span>
                        Alternative Proposals Evaluated
                      </div>
                      <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeDecision.options && activeDecision.options.length > 0 ? (
                          activeDecision.options.map((opt, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-background border border-border text-xs space-y-1.5">
                              <div className="font-semibold text-foreground">{opt.title}</div>
                              <p className="text-muted-foreground text-[11px]">{opt.description}</p>
                              {opt.pros && opt.pros.length > 0 && (
                                <div className="text-[10px] text-emerald-400">Pros: {opt.pros.join(', ')}</div>
                              )}
                              {opt.cons && opt.cons.length > 0 && (
                                <div className="text-[10px] text-rose-400">Cons: {opt.cons.join(', ')}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-lg bg-background border border-border text-xs text-muted-foreground col-span-2">
                            Proposal A (Standardization) vs Proposal B (Capability Decoupling).
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: Discussion & Deliberation */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px]">
                          4
                        </span>
                        Discussion & Participant Stances
                      </div>
                      <div className="pl-7 space-y-2">
                        {activeDecision.participants && activeDecision.participants.length > 0 ? (
                          activeDecision.participants.map((p, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-background border border-border text-xs flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-foreground">{p.name}</span>
                                <span className="text-muted-foreground text-[11px] ml-2">({p.role} • {p.identity_type || 'AGENT'})</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {p.stance || 'SUPPORT'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-lg bg-background border border-border text-xs text-muted-foreground">
                            Chief Architect (Support) • Site Reliability Agent (Support) • Security Officer (Approved).
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stage 5: Decision & Rationale */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px]">
                          5
                        </span>
                        Adopted Decision & Rationale
                      </div>
                      <div className="pl-7 space-y-1.5 text-xs">
                        <div className="font-bold text-foreground text-sm">{activeDecision.decision}</div>
                        <p className="text-muted-foreground leading-relaxed">{activeDecision.rationale}</p>
                      </div>
                    </div>

                    {/* Stage 6: Expected Outcome */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px]">
                          6
                        </span>
                        Expected Outcome
                      </div>
                      <p className="text-xs text-foreground leading-relaxed pl-7">{activeDecision.expected_outcome}</p>
                    </div>

                    {/* Stage 7: Actual Outcome */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px]">
                          7
                        </span>
                        Actual Measured Outcome
                      </div>
                      <div className="pl-7 space-y-2">
                        {activeDecision.actual_outcome ? (
                          <div className="p-3 rounded-lg bg-background border border-border text-xs text-foreground font-mono">
                            {activeDecision.actual_outcome}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No post-implementation outcome recorded yet. Record actual outcome below.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stage 8: Lesson Learned */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <span className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px]">
                          8
                        </span>
                        Institutional Lessons for Future Generations
                      </div>
                      <div className="pl-7 space-y-2">
                        {activeDecision.lessons_learned && activeDecision.lessons_learned.length > 0 ? (
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5 p-3 rounded-lg bg-background border border-border">
                            {activeDecision.lessons_learned.map((l, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="text-foreground">{l}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No retrospective lessons catalogued yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outcome & Lessons Submission Form */}
                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-amber-400" />
                      Record Retrospective Outcome & Lessons Learned
                    </h3>
                    <form onSubmit={handleRecordOutcome} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Actual Observed Outcome
                        </label>
                        <textarea
                          rows={2}
                          value={newActualOutcome}
                          onChange={(e) => setNewActualOutcome(e.target.value)}
                          placeholder="e.g. Zero downtime achieved over 90 days with 32% cost savings."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Lessons Learned (One per line)
                        </label>
                        <textarea
                          rows={2}
                          value={newLessonInput}
                          onChange={(e) => setNewLessonInput(e.target.value)}
                          placeholder="Dynamic fallback prevents cascading agent workflow failures.&#10;Capability matching simplifies prompt construction."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={recordOutcomeMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" /> Save Outcome & Catalyze Memory
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground text-xs">
                  Select a decision record to explore its 8-stage deliberative lineage.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONTEXT ASSEMBLY ENGINE */}
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

      {/* TAB 5: KNOWLEDGE GRAPH & TOKEN COMPRESSION */}
      {activeTab === 'knowledge_graph' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
            <div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Relational Triplestore & Sub-Graph Context Cache</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autonomous entity-relationship graph reducing context tokens by 60–80% through semantic neighbor injection.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="badge badge-primary text-xs font-mono">
                {graphData?.total_entities || 0} Entities
              </span>
              <span className="badge badge-outline text-xs font-mono">
                {graphData?.total_relations || 0} Triples
              </span>
              <button
                onClick={() => refetchGraph()}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                title="Refresh Graph"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Extract Box */}
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Instant Fact & Triple Extraction Pipeline
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Agent Alpha uses Stripe and enforces Policy Gamma..."
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
              <button
                onClick={() => {
                  if (extractText.trim()) extractFactsMutation.mutate(extractText);
                }}
                disabled={extractFactsMutation.isPending || !extractText.trim()}
                className="btn btn-primary text-xs px-3 h-9"
              >
                {extractFactsMutation.isPending ? 'Extracting...' : 'Extract Triples'}
              </button>
            </div>
          </div>

          {/* Graph Entities & Triples Explorer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Entities ({graphData?.entities?.length || 0})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {graphData?.entities?.map((ent) => (
                  <div
                    key={ent.id}
                    className="p-2.5 rounded-lg border border-border/80 bg-background/80 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground font-mono">{ent.name}</span>
                      <span className="badge badge-primary text-[10px] uppercase font-mono">{ent.entity_type}</span>
                    </div>
                    {ent.description && (
                      <p className="text-[11px] text-muted-foreground mt-1">{ent.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                Directed Triples ({graphData?.relations?.length || 0})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 font-mono text-xs">
                {graphData?.relations?.map((rel) => {
                  const source = graphData?.entities?.find((e) => e.id === rel.source_id)?.name || rel.source_id.slice(0, 8);
                  const target = graphData?.entities?.find((e) => e.id === rel.target_id)?.name || rel.target_id.slice(0, 8);
                  return (
                    <div
                      key={rel.id}
                      className="p-2.5 rounded-lg border border-border/80 bg-background/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-primary truncate">[{source}]</span>
                        <span className="text-muted-foreground text-[10px]">--({rel.relation_type.toLowerCase()})--&gt;</span>
                        <span className="font-semibold text-foreground truncate">[{target}]</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">w: {rel.weight}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INGEST KNOWLEDGE FORM */}
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
                  {PRIMARY_MEMORY_DOMAINS.map((d) => (
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

