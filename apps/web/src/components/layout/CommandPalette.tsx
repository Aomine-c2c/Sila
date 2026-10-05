'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  Bot,
  GitBranch,
  Zap,
  Brain,
  Sparkles,
  Scale,
  Shield,
  Database,
  FileText,
  Settings,
  FolderKanban,
  CheckSquare,
  FlaskConical,
  X,
  ArrowRight,
  Command,
  PlusCircle,
  PauseCircle,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkle,
  Terminal,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

type RBACRole = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'VIEWER';

export interface PaletteCommand {
  id: string;
  title: string;
  category: 'Commands' | 'Navigation' | 'Actions' | 'Inquiries' | 'Simulations';
  description?: string;
  href?: string;
  icon: any;
  keywords: string[];
  requiredRole?: RBACRole;
  actionType?: 'NAVIGATE' | 'MODAL_ACTION' | 'AI_QUERY' | 'SYSTEM_ACTION';
  payload?: any;
  badge?: string;
}

const ROLE_HIERARCHY: Record<RBACRole, number> = {
  VIEWER: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

export const GLOBAL_COMMANDS: PaletteCommand[] = [
  // ── CORE SPECIFIED COMMANDS ──────────────────────────────────────────
  {
    id: 'cmd-search-agents',
    title: 'Search agents',
    category: 'Commands',
    description: 'Find, filter, and inspect autonomous workforce agents',
    href: '/dashboard/agents',
    icon: Bot,
    keywords: ['search agents', 'find agent', 'workforce', 'bot', 'specialist'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Query',
  },
  {
    id: 'cmd-open-project',
    title: 'Open project',
    category: 'Commands',
    description: 'Jump to active initiatives, milestones, and roadmaps',
    href: '/dashboard/projects',
    icon: FolderKanban,
    keywords: ['open project', 'projects', 'initiatives', 'roadmap', 'alpha', 'beta'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Nav',
  },
  {
    id: 'cmd-create-task',
    title: 'Create task',
    category: 'Commands',
    description: 'Draft and queue a new autonomous task for agent execution',
    href: '/dashboard/tasks?action=new',
    icon: PlusCircle,
    keywords: ['create task', 'new task', 'assign task', 'todo', 'issue'],
    requiredRole: 'MANAGER',
    actionType: 'MODAL_ACTION',
    payload: { action: 'CREATE_TASK' },
    badge: 'Action',
  },
  {
    id: 'cmd-pause-agent',
    title: 'Pause agent',
    category: 'Commands',
    description: 'Safely halt active reasoning and freeze agent execution loops',
    href: '/dashboard/agents?filter=active',
    icon: PauseCircle,
    keywords: ['pause agent', 'stop agent', 'freeze worker', 'halt execution'],
    requiredRole: 'MANAGER',
    actionType: 'SYSTEM_ACTION',
    payload: { action: 'PAUSE_AGENT' },
    badge: 'Control',
  },
  {
    id: 'cmd-view-approvals',
    title: 'View approvals',
    category: 'Commands',
    description: 'Inspect human-in-the-loop approval gate and pending escalations',
    href: '/dashboard/approvals',
    icon: Shield,
    keywords: ['view approvals', 'pending approvals', 'human in the loop', 'review gate', 'sign off'],
    requiredRole: 'MANAGER',
    actionType: 'NAVIGATE',
    badge: 'Gate',
  },
  {
    id: 'cmd-inspect-resources',
    title: 'Inspect resources',
    category: 'Commands',
    description: 'Examine CPU, RAM, GPU, tokens, API calls, and telemetry vs estimates',
    href: '/dashboard/resources',
    icon: Database,
    keywords: ['inspect resources', 'resource command center', 'telemetry', 'gpu', 'tokens', 'budget'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Telemetry',
  },
  {
    id: 'cmd-open-workflow',
    title: 'Open workflow',
    category: 'Commands',
    description: 'Inspect DAG workflow execution pipelines and dependency trees',
    href: '/dashboard/workflows',
    icon: GitBranch,
    keywords: ['open workflow', 'workflows', 'dag', 'pipeline', 'execution graph'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Nav',
  },
  {
    id: 'cmd-search-memory',
    title: 'Search memory',
    category: 'Commands',
    description: 'Query company vector memory, ADR decisions, and provenance traces',
    href: '/dashboard/memory',
    icon: Brain,
    keywords: ['search memory', 'query knowledge', 'organizational memory', 'provenance', 'adrs'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Search',
  },
  {
    id: 'cmd-run-simulation',
    title: 'Run simulation',
    category: 'Commands',
    description: 'Trigger synthetic workload stress trial in Simulation Lab',
    href: '/dashboard/simulation',
    icon: FlaskConical,
    keywords: ['run simulation', 'monte carlo', 'simulation lab', 'stress test', 'benchmark'],
    requiredRole: 'MANAGER',
    actionType: 'NAVIGATE',
    badge: 'Lab',
  },
  {
    id: 'cmd-create-decision',
    title: 'Create decision',
    category: 'Commands',
    description: 'Record architectural decision record (ADR) into company ledger',
    href: '/dashboard/decisions?action=new',
    icon: Scale,
    keywords: ['create decision', 'new adr', 'record decision', 'ledger', 'consensus'],
    requiredRole: 'MANAGER',
    actionType: 'MODAL_ACTION',
    payload: { action: 'CREATE_DECISION' },
    badge: 'Action',
  },
  {
    id: 'cmd-ask-organization',
    title: 'Ask organization',
    category: 'Commands',
    description: 'Query synthesized organizational knowledge and agent intelligence',
    href: '/dashboard/memory?tab=ask',
    icon: HelpCircle,
    keywords: ['ask organization', 'query neiman', 'semantic inquiry', 'why is delayed', 'ask company'],
    requiredRole: 'VIEWER',
    actionType: 'AI_QUERY',
    badge: 'AI',
  },
  {
    id: 'cmd-open-settings',
    title: 'Open settings',
    category: 'Commands',
    description: 'Configure workspace identity, AI providers, RBAC, and credentials',
    href: '/dashboard/settings',
    icon: Settings,
    keywords: ['open settings', 'admin', 'configuration', 'api keys', 'rbac', 'security'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: 'Admin',
  },

  // ── USER SPECIFIED NATURAL EXAMPLES ─────────────────────────────────
  {
    id: 'ex-create-qa-agent',
    title: 'create a QA agent',
    category: 'Actions',
    description: 'Autonomous action: Provisions a QA Automator agent in Engineering',
    href: '/dashboard/agents?action=create&role=QA',
    icon: Bot,
    keywords: ['create a qa agent', 'create qa', 'add test agent', 'new tester', 'qa bot'],
    requiredRole: 'MANAGER',
    actionType: 'MODAL_ACTION',
    payload: { role: 'QA Automator', department: 'Engineering' },
    badge: '> prompt',
  },
  {
    id: 'ex-show-blocked-projects',
    title: 'show blocked projects',
    category: 'Inquiries',
    description: 'Filter projects encountering resource exhaustion or waiting on approvals',
    href: '/dashboard/projects?filter=blocked',
    icon: AlertTriangle,
    keywords: ['show blocked projects', 'blocked projects', 'stalled projects', 'bottlenecks'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: '> prompt',
  },
  {
    id: 'ex-why-alpha-delayed',
    title: 'why is Project Alpha delayed?',
    category: 'Inquiries',
    description: 'Synthesizes root-cause diagnosis from telemetry logs and decision records',
    href: '/dashboard/memory?query=Project+Alpha+delayed+root+cause',
    icon: Brain,
    keywords: ['why is project alpha delayed', 'project alpha delay', 'alpha root cause', 'why delayed'],
    requiredRole: 'VIEWER',
    actionType: 'AI_QUERY',
    payload: {
      topic: 'Project Alpha Latency',
      diagnosis: 'Delayed by 4.2h awaiting Architecture Council deliberation on Gemini vs Claude routing.',
    },
    badge: '> inquiry',
  },
  {
    id: 'ex-open-security-dept',
    title: 'open Security Department',
    category: 'Navigation',
    description: 'Navigate directly to Security & Compliance departmental cockpit',
    href: '/dashboard/departments?dept=security',
    icon: Shield,
    keywords: ['open security department', 'security department', 'compliance dept', 'security'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: '> prompt',
  },
  {
    id: 'ex-show-todays-decisions',
    title: "show today's decisions",
    category: 'Inquiries',
    description: "Display immutable Decision Records ratified in the last 24 hours",
    href: '/dashboard/decisions?filter=today',
    icon: Scale,
    keywords: ["show today's decisions", "todays decisions", "recent decisions", "adrs today"],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
    badge: '> prompt',
  },
  {
    id: 'ex-simulate-gemini-vs-claude',
    title: 'simulate using Gemini instead of Claude',
    category: 'Simulations',
    description: 'Spawns sandbox scenario benchmarking Gemini 1.5 Pro against Claude 3.5 baseline',
    href: '/dashboard/simulation?scenario=gemini-vs-claude',
    icon: FlaskConical,
    keywords: ['simulate using gemini instead of claude', 'gemini vs claude', 'routing trial', 'test gemini'],
    requiredRole: 'MANAGER',
    actionType: 'NAVIGATE',
    payload: { scenario: 'Gemini Routing Trial' },
    badge: '> simulate',
  },

  // ── QUICK SYSTEM DESTINATIONS ─────────────────────────────────────────
  {
    id: 'nav-control-room',
    title: 'Control Room',
    category: 'Navigation',
    description: 'Core organizational operating status and workforce metrics',
    href: '/dashboard',
    icon: LayoutDashboard,
    keywords: ['control room', 'overview', 'metrics', 'home', 'control room overview'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
  },
  {
    id: 'nav-departments',
    title: 'Departments',
    category: 'Navigation',
    description: 'Autonomous departmental units, rosters, and budgets',
    href: '/dashboard/departments',
    icon: Building2,
    keywords: ['departments', 'org units', 'divisions', 'teams'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
  },
  {
    id: 'nav-simulation-lab',
    title: 'Simulation Lab',
    category: 'Navigation',
    description: 'Monte Carlo stress trials, synthetic workloads, and counterfactual testing',
    href: '/dashboard/simulation',
    icon: FlaskConical,
    keywords: ['simulation lab', 'simulations', 'stress test', 'scenario', 'trials'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
  },
  {
    id: 'nav-councils',
    title: 'Agent Councils Deliberation',
    category: 'Navigation',
    description: 'Visual multi-agent debate mesh and consensus synthesis',
    href: '/dashboard/councils',
    icon: Users,
    keywords: ['councils', 'architecture council', 'deliberation', 'debate'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
  },
  {
    id: 'nav-evolution',
    title: 'Evolution Center',
    category: 'Navigation',
    description: 'Organizational self-improvement proposals, validations, and rollbacks',
    href: '/dashboard/evolution',
    icon: Sparkles,
    keywords: ['evolution center', 'self improvement', 'proposals', 'diagnoses', 'lessons'],
    requiredRole: 'VIEWER',
    actionType: 'NAVIGATE',
  },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);
  const router = useRouter();

  // Retrieve user role from auth store
  const { user } = useAuthStore();
  const userRole: RBACRole = user?.is_superuser ? 'SUPERADMIN' : 'ADMIN';

  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
    setActiveFeedback(null);
  }, [isOpen]);

  // Check RBAC permission for a command
  const isPermitted = (cmd: PaletteCommand) => {
    if (!cmd.requiredRole) return true;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[cmd.requiredRole];
  };

  // Filter commands by query and natural language matches
  const filtered = useMemo(() => {
    if (!query.trim()) return GLOBAL_COMMANDS;
    const q = query.toLowerCase().replace(/^>\s*/, '').trim();

    return GLOBAL_COMMANDS.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(q);
      const categoryMatch = cmd.category.toLowerCase().includes(q);
      const descMatch = cmd.description?.toLowerCase().includes(q);
      const keywordMatch = cmd.keywords.some((kw) => kw.toLowerCase().includes(q));
      return titleMatch || categoryMatch || descMatch || keywordMatch;
    });
  }, [query]);

  const handleSelect = (item: PaletteCommand) => {
    if (!isPermitted(item)) {
      setActiveFeedback(`Permission Denied: Command requires ${item.requiredRole} role.`);
      setTimeout(() => setActiveFeedback(null), 3000);
      return;
    }

    if (item.actionType === 'AI_QUERY' && item.payload) {
      setActiveFeedback(`NEIMAN Insight: ${item.payload.diagnosis}`);
      setTimeout(() => {
        onClose();
        if (item.href) router.push(item.href);
      }, 2000);
      return;
    }

    onClose();
    if (item.href) {
      router.push(item.href);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="NEIMAN Global Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3.5 bg-secondary/30">
          <Command className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          <input
            type="text"
            className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/60 outline-none"
            placeholder="Type a command or query... (e.g. 'create a QA agent', 'why is Project Alpha delayed?')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
              setActiveFeedback(null);
            }}
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setQuery('')}
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/60">
            ESC
          </span>
        </div>

        {/* Feedback / Permission Notice Banner */}
        {activeFeedback && (
          <div className="p-3 bg-primary/10 border-b border-primary/20 text-xs font-mono text-primary flex items-center gap-2 animate-fade-in">
            <Info className="h-4 w-4 shrink-0" />
            <span>{activeFeedback}</span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground space-y-2">
              <Terminal className="h-8 w-8 mx-auto opacity-40 text-primary" />
              <p>No matching commands found for &quot;{query}&quot;</p>
              <p className="text-[11px] text-muted-foreground/70">
                Try queries like: <span className="text-primary">&gt; create a QA agent</span>, <span className="text-primary">&gt; show blocked projects</span>, or <span className="text-primary">Search memory</span>
              </p>
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const active = idx === selectedIndex;
              const Icon = cmd.icon;
              const permitted = isPermitted(cmd);

              return (
                <button
                  key={cmd.id}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
                      : 'text-foreground/90 hover:bg-secondary/60 hover:text-foreground border border-transparent'
                  } ${!permitted ? 'opacity-50' : ''}`}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                        active ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate text-foreground font-mono">
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span className="badge badge-secondary text-[9px] px-1.5 py-0 h-4 font-mono uppercase">
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Action Indicator & RBAC Lock */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground shrink-0">
                    {!permitted ? (
                      <span className="flex items-center gap-1 text-rose-400">
                        <Lock className="h-3 w-3" />
                        <span>Requires {cmd.requiredRole}</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground/80">
                        <span>Execute</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts & Role Indicator */}
        <div className="flex items-center justify-between border-t border-border/80 bg-secondary/20 px-4 py-2 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">ROLE: {userRole}</span>
            <span className="text-primary flex items-center gap-1">
              <Command className="h-3 w-3" />
              <span>NEIMAN Command Layer</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
