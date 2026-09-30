'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  FileCheck,
  FolderGit2,
  Lock,
  Scale,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { Agent } from '@/lib/api/agents';
import type {
  ApprovalRequest,
  AuditLog,
  DecisionRecord,
  MemoryItem,
  ModelProviderInfo,
  Policy,
  Project,
  ResourceSummary,
  Task,
} from '@/lib/api/controlRoom';

interface OperationalGridProps {
  companyId: string;
  agents: Agent[];
  projects: Project[];
  tasks: Task[];
  approvals: ApprovalRequest[];
  audits: AuditLog[];
  resources: ResourceSummary;
  decisions: DecisionRecord[];
  policies: Policy[];
  memories: MemoryItem[];
  providers: ModelProviderInfo[];
  onDecideApproval?: (approvalId: string, decision: 'APPROVED' | 'REJECTED') => void;
}

export function OperationalGrid({
  companyId,
  agents,
  projects,
  tasks,
  approvals,
  audits,
  resources,
  decisions,
  policies,
  memories,
  providers,
  onDecideApproval,
}: OperationalGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMN 1: Workforce & Active Executions */}
      <div className="space-y-6">
        {/* 1. Active Projects & Tasks */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Projects & Active Tasks</h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{projects.length} Total</span>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="rounded-xl border border-border/50 bg-secondary/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{p.title}</span>
                  <span className="badge badge-success text-[10px]">{p.status}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Priority: {p.priority}</span>
                  <span className="font-mono">{p.progress_pct}%</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${p.progress_pct}%` }}
                  />
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active projects initialized
              </div>
            )}
          </div>
        </div>

        {/* 2. Agent Workforce Status */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-foreground">Agent Workforce</h3>
            </div>
            <Link href="/dashboard/agents" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {agents.slice(0, 4).map((ag) => (
              <div key={ag.id} className="flex items-center justify-between rounded-xl bg-secondary/20 p-2.5 border border-border/40 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{ag.name}</h4>
                    <p className="text-[10px] text-muted-foreground">Autonomy: {ag.autonomy}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/80 text-foreground">
                  {ag.status}
                </span>
              </div>
            ))}

            {agents.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No agents configured yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2: Governance, Approvals & Intelligence */}
      <div className="space-y-6">
        {/* 1. Human-in-the-Loop Approvals */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Human Approvals Gate</h3>
            </div>
            <span className="badge badge-warning text-[10px]">{approvals.length} Pending</span>
          </div>

          <div className="space-y-3">
            {approvals.length > 0 ? (
              approvals.map((req) => (
                <div key={req.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{req.action_type}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                      {req.risk_level} RISK
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{req.reason}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDecideApproval?.(req.id, 'APPROVED')}
                      className="btn btn-primary text-xs h-7 px-3 flex-1"
                    >
                      Authorize
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecideApproval?.(req.id, 'REJECTED')}
                      className="btn btn-outline text-xs h-7 px-3 flex-1 hover:text-red-400"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border/40 bg-secondary/20 p-6 text-center text-xs text-muted-foreground">
                <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2 opacity-80" />
                No actions currently blocked awaiting human approval
              </div>
            )}
          </div>
        </div>

        {/* 2. Intelligence Mesh & Multi-Model Providers */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-foreground">Intelligence Providers</h3>
            </div>
            <Link href="/dashboard/intelligence" className="text-xs text-primary hover:underline flex items-center gap-1">
              Mesh <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {providers.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/40 bg-secondary/20 p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs font-semibold text-foreground">{p.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Latency: {p.avg_latency_ms}ms · Tokens: {(p.total_tokens / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground font-mono">
                    ${p.cost_usd.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.active_requests} active</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLUMN 3: Decisions, Policies & Live Audit Timeline */}
      <div className="space-y-6">
        {/* 1. Deliberation & Decisions */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">Recent Decisions</h3>
            </div>
            <Link href="/dashboard/decisions" className="text-xs text-primary hover:underline flex items-center gap-1">
              All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {decisions.slice(0, 3).map((dec) => (
              <div key={dec.id} className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[200px]">{dec.problem}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-primary">
                    {dec.status}
                  </span>
                </div>
                {dec.decision && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{dec.decision}</p>
                )}
              </div>
            ))}

            {decisions.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No formal decisions recorded yet
              </div>
            )}
          </div>
        </div>

        {/* 2. Consequential Audit Timeline */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">Consequential Audit Trail</h3>
            </div>
            <Link href="/dashboard/governance" className="text-xs text-primary hover:underline flex items-center gap-1">
              Audit Logs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {audits.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-foreground truncate">{log.action}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {log.result ?? 'SUCCESS'}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-[11px] text-muted-foreground truncate">{log.reason}</p>
                  )}
                </div>
              </div>
            ))}

            {audits.length === 0 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No audit events recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
