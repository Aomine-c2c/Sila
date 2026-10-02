'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  href: string;
  icon: React.ElementType;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  // OPERATE
  { id: 'dashboard', title: 'Control Room', category: 'Operate', href: '/dashboard', icon: LayoutDashboard, keywords: ['overview', 'metrics', 'home'] },
  { id: 'organizations', title: 'Organizations', category: 'Operate', href: '/dashboard/organizations', icon: Building2, keywords: ['companies', 'tenant', 'firm'] },
  { id: 'departments', title: 'Departments', category: 'Operate', href: '/dashboard/departments', icon: Users, keywords: ['teams', 'hierarchy', 'structure'] },
  { id: 'agents', title: 'Agents Workforce', category: 'Operate', href: '/dashboard/agents', icon: Bot, keywords: ['workers', 'ai', 'lifecycle'] },
  { id: 'projects', title: 'Projects', category: 'Operate', href: '/dashboard/projects', icon: FolderKanban, keywords: ['initiatives', 'roadmap'] },
  { id: 'tasks', title: 'Tasks Backlog', category: 'Operate', href: '/dashboard/tasks', icon: CheckSquare, keywords: ['todo', 'kanban', 'work'] },
  { id: 'workflows', title: 'Workflows & DAGs', category: 'Operate', href: '/dashboard/workflows', icon: GitBranch, keywords: ['pipelines', 'execution'] },
  { id: 'councils', title: 'Deliberation Councils', category: 'Operate', href: '/dashboard/councils', icon: Users, keywords: ['review', 'synthesis', 'cto'] },

  // INTELLIGENCE
  { id: 'intelligence', title: 'Provider Mesh & Routing', category: 'Intelligence', href: '/dashboard/intelligence', icon: Zap, keywords: ['llm', 'claude', 'gemini', 'openai', 'ollama'] },
  { id: 'memory', title: 'Organizational Memory', category: 'Intelligence', href: '/dashboard/memory', icon: Brain, keywords: ['vector', 'recall', 'adrs'] },
  { id: 'evolution', title: 'Evolution Engine', category: 'Intelligence', href: '/dashboard/evolution', icon: Sparkles, keywords: ['adaptation', 'mutation', 'kpi'] },
  { id: 'simulation', title: 'Simulation Lab', category: 'Intelligence', href: '/dashboard/simulation', icon: FlaskConical, keywords: ['monte carlo', 'stress test', 'scenario'] },

  // GOVERN
  { id: 'decisions', title: 'Decision Records (ADR)', category: 'Govern', href: '/dashboard/decisions', icon: Scale, keywords: ['immutable', 'ledger', 'audit'] },
  { id: 'governance', title: 'Governance & Constitution', category: 'Govern', href: '/dashboard/governance', icon: Shield, keywords: ['autonomy', 'policy', 'rules'] },
  { id: 'approvals', title: 'Pending Approvals', category: 'Govern', href: '/dashboard/approvals', icon: Shield, keywords: ['human in the loop', 'sign off', 'requests'] },
  { id: 'activity', title: 'Activity & Audit Feed', category: 'Govern', href: '/dashboard/activity', icon: Sparkles, keywords: ['audit', 'feed', 'stream', 'events', 'logs'] },
  { id: 'resources', title: 'Resource Control Center', category: 'Govern', href: '/dashboard/resources', icon: Database, keywords: ['quotas', 'tokens', 'compute', 'budget'] },
  { id: 'blueprints', title: 'Company Blueprints', category: 'Govern', href: '/dashboard/blueprints', icon: FileText, keywords: ['templates', 'catalog', 'synthesis'] },
  { id: 'settings', title: 'Workspace Settings', category: 'Govern', href: '/dashboard/settings', icon: Settings, keywords: ['profile', 'account', 'security'] },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setQuery('');
    setSelectedIndex(0);
  }, [isOpen]);

  const filtered = COMMANDS.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-nexora-surface shadow-2xl overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3.5">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            type="text"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            placeholder="Type a command or search anything... (e.g. Agents, Blueprints, Simulation)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
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
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const active = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-foreground/80 hover:bg-secondary/60 hover:text-foreground border border-transparent'
                  }`}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        active ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cmd.title}</p>
                      <span className="text-[10px] text-muted-foreground">{cmd.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>Jump</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border/80 bg-background/50 px-4 py-2 text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1 text-primary/70">
            <Command className="h-3 w-3" />
            <span>NEXORA Quick Command</span>
          </div>
        </div>
      </div>
    </div>
  );
}
