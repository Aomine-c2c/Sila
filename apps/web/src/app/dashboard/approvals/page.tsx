'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Bot,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { governanceApi, ApprovalRequest } from '@/lib/api/governance';
import { useOrganizationContext } from '@/lib/organizationContext';
import { ApiError } from '@/lib/api/client';

const RISK_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  MEDIUM: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  HIGH: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export default function ApprovalsPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const qc = useQueryClient();

  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // List pending approvals
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['pending-approvals', companyId],
    queryFn: () => governanceApi.listApprovals(companyId, 'PENDING'),
    enabled: !!companyId,
    refetchInterval: 15_000,
  });

  // Decide mutation
  const decideMutation = useMutation({
    mutationFn: ({
      requestId,
      decision,
      notes,
    }: {
      requestId: string;
      decision: 'APPROVED' | 'REJECTED';
      notes?: string;
    }) =>
      governanceApi.decideApproval(companyId, requestId, {
        decision,
        reviewer_notes: notes || (decision === 'APPROVED' ? 'Approved by human executive' : 'Rejected by human executive'),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-approvals', companyId] });
      qc.invalidateQueries({ queryKey: ['pending-approvals-count', companyId] });
      setErrorMsg(null);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to record approval decision.');
      }
    },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Human-in-the-Loop Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and sign off on high-risk autonomous agent operations, budget overages, and policy escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>Real-time governance queue</span>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            {error instanceof ApiError ? error.message : 'Failed to load approval queues.'}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">All queues clear</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              There are no pending actions waiting for human executive sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Requests List */}
      {!isLoading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const riskStyle = RISK_BADGES[req.risk_level] || RISK_BADGES.MEDIUM;
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{req.action}</h3>
                      <p className="text-[11px] font-mono text-muted-foreground">ID: {req.id}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium self-start sm:self-auto ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border}`}
                  >
                    Risk Level: {req.risk_level}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-foreground/90 font-medium">Justification / Reason:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {req.reason || 'Agent initiated high-impact operation requiring supervisory authorization.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <input
                    type="text"
                    className="input text-xs flex-1 h-9"
                    placeholder="Optional executive rationale / notes..."
                    value={decisionNotes[req.id] || ''}
                    onChange={(e) =>
                      setDecisionNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                    }
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline text-xs h-9 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() =>
                        decideMutation.mutate({
                          requestId: req.id,
                          decision: 'REJECTED',
                          notes: decisionNotes[req.id],
                        })
                      }
                      disabled={decideMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary text-xs h-9 px-4"
                      onClick={() =>
                        decideMutation.mutate({
                          requestId: req.id,
                          decision: 'APPROVED',
                          notes: decisionNotes[req.id],
                        })
                      }
                      disabled={decideMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve & Execute
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
