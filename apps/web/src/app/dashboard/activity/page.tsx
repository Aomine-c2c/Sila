'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Shield,
  Bot,
  Scale,
  GitBranch,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { governanceApi, GovernanceAuditLog } from '@/lib/api/governance';
import { useOrganizationContext } from '@/lib/organizationContext';
import { ApiError } from '@/lib/api/client';

const RESULT_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  ALLOWED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  DENIED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  APPROVED: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  BLOCKED: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export default function ActivityLogPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState<string>('ALL');

  const { data: audits = [], isLoading, error } = useQuery({
    queryKey: ['governance-audits', companyId],
    queryFn: () => governanceApi.queryAudits(companyId, { limit: 50 }),
    enabled: !!companyId,
    refetchInterval: 15_000,
  });

  const filtered = audits.filter((item) => {
    if (filterResult !== 'ALL' && item.result !== filterResult) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.action.toLowerCase().includes(q) ||
      item.actor_name.toLowerCase().includes(q) ||
      item.target.toLowerCase().includes(q) ||
      (item.reason && item.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Stream & Audit Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable, cryptographic HMAC audit ledger recording all organizational agent events and governance decisions.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-1.5 text-xs font-mono text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>Real-time event stream</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            className="input pl-9 text-xs w-full h-9 bg-secondary/40"
            placeholder="Search activity by actor, action, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          {['ALL', 'ALLOWED', 'DENIED', 'APPROVED'].map((res) => (
            <button
              key={res}
              type="button"
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filterResult === res
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              onClick={() => setFilterResult(res)}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error instanceof ApiError ? error.message : 'Failed to load activity stream.'}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground">
            <Activity className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">No activity recorded</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Agent executions and governance actions will appear here in real-time.
            </p>
          </div>
        </div>
      )}

      {/* Activity Timeline List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const badge = RESULT_BADGES[item.result] || RESULT_BADGES.ALLOWED;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{item.actor_name}</span>
                      <span className="text-xs text-muted-foreground">performed</span>
                      <span className="text-xs font-mono font-medium text-primary">{item.action}</span>
                      <span className="text-xs text-muted-foreground">on</span>
                      <span className="text-xs font-medium text-foreground truncate">{item.target}</span>
                    </div>
                    {item.reason && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.reason}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium font-mono ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {item.result}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
