'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Scale,
  Brain,
  Plus,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Bot,
  Layers,
  HelpCircle,
  X,
  FileText,
  Zap,
} from 'lucide-react';
import { useOrganizationContext } from '@/lib/organizationContext';
import {
  councilsApi,
  type AgentCouncil,
  type CouncilDeliberation,
  type CouncilMember,
} from '@/lib/api/councils';

// Preset Canonical Architecture Council
const CANONICAL_COUNCIL_MEMBERS: CouncilMember[] = [
  {
    role_title: 'CTO',
    agent_name: 'Chief Technology Agent',
    perspective: 'Strategic Feasibility & Business Alignment',
    model_identifier: 'gpt-4o',
    model_provider: 'openai',
  },
  {
    role_title: 'Chief Architect',
    agent_name: 'Systems Architect Agent',
    perspective: 'Scalability, Modularity & Distributed Systems',
    model_identifier: 'claude-3-5-sonnet',
    model_provider: 'anthropic',
  },
  {
    role_title: 'Principal Backend Engineer',
    agent_name: 'Backend Engineering Agent',
    perspective: 'Implementation Complexity & Performance',
    model_identifier: 'gemini-1.5-pro',
    model_provider: 'google',
  },
  {
    role_title: 'Principal Security Engineer',
    agent_name: 'Cybersecurity Agent',
    perspective: 'Zero-Trust, Attack Vectors & Compliance',
    model_identifier: 'claude-3-5-haiku',
    model_provider: 'anthropic',
  },
  {
    role_title: 'QA Lead',
    agent_name: 'Quality Assurance Agent',
    perspective: 'Testability, Chaos Tolerance & Edge Cases',
    model_identifier: 'gpt-4o-mini',
    model_provider: 'openai',
  },
];

export default function CouncilsDashboardPage() {
  const qc = useQueryClient();
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id;

  const [selectedCouncil, setSelectedCouncil] = useState<AgentCouncil | null>(null);
  const [selectedDelib, setSelectedDelib] = useState<CouncilDeliberation | null>(null);

  // Modals
  const [showCreateCouncil, setShowCreateCouncil] = useState(false);
  const [showStartDelib, setShowStartDelib] = useState(false);

  // New Deliberation Form
  const [delibTitle, setDelibTitle] = useState('');
  const [delibProblem, setDelibProblem] = useState('');

  // 1. Fetch Councils
  const { data: councils = [], isLoading: councilsLoading } = useQuery({
    queryKey: ['councils', companyId],
    queryFn: () => councilsApi.list(companyId!),
    enabled: !!companyId,
  });

  // 2. Fetch Deliberations for selected council
  const { data: deliberations = [], isLoading: delibsLoading } = useQuery({
    queryKey: ['council-deliberations', companyId, selectedCouncil?.id],
    queryFn: () => councilsApi.listDeliberations(companyId!, selectedCouncil!.id),
    enabled: !!companyId && !!selectedCouncil?.id,
  });

  // 3. Create Canonical Architecture Council
  const createCouncilMutation = useMutation({
    mutationFn: () =>
      councilsApi.create(companyId!, {
        name: 'Architecture & Technical Governance Council',
        charter:
          'Evaluates cross-cutting system design, multi-model intelligence routing, and reliability tradeoffs.',
        council_type: 'PERMANENT',
        members: CANONICAL_COUNCIL_MEMBERS,
      }),
    onSuccess: (council) => {
      qc.invalidateQueries({ queryKey: ['councils', companyId] });
      setSelectedCouncil(council);
      setShowCreateCouncil(false);
    },
  });

  // 4. Start Deliberation Run
  const startDelibMutation = useMutation({
    mutationFn: () =>
      councilsApi.startDeliberation(companyId!, selectedCouncil!.id, {
        title: delibTitle || 'Cross-Region Fallback Architecture',
        problem_statement:
          delibProblem ||
          'Primary model provider (Claude 3.5 Sonnet) experiences latency spikes under heavy load. How should the system route requests across Gemini 1.5 Pro and local models while maintaining structured schema validity?',
        auto_execute_deliberation: true,
      }),
    onSuccess: (delib) => {
      qc.invalidateQueries({ queryKey: ['council-deliberations', companyId, selectedCouncil?.id] });
      setSelectedDelib(delib);
      setShowStartDelib(false);
      setDelibTitle('');
      setDelibProblem('');
    },
  });

  // 5. Ratify Decision Mutation
  const ratifyMutation = useMutation({
    mutationFn: (delibId: string) =>
      councilsApi.ratifyDecision(companyId!, delibId, {
        decision: selectedDelib?.synthesis_proposal?.synthesized_decision || 'Ratified synthesized consensus',
        rationale: 'Ratified by supervisory executive from Council Command Room.',
        record_in_memory: true,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['council-deliberations', companyId, selectedCouncil?.id] });
      setSelectedDelib(updated);
    },
  });

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-foreground">No Organization Selected</h2>
        <p className="text-sm text-muted-foreground">Select an active company to convene agent councils.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Agent Councils & Organizational Deliberation
            </h1>
            <span className="badge badge-primary text-xs">Phase 10 Core</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-model deliberation mesh: Independent Review → Objections → Debate → Synthesis → Dissent Preservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => createCouncilMutation.mutate()}
            disabled={createCouncilMutation.isPending}
            className="btn btn-primary gap-2 text-xs"
          >
            {createCouncilMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Convene Architecture Council
          </button>
        </div>
      </div>

      {/* Main Grid: Councils & Deliberations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assembled Councils & History */}
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Permanent Councils ({councils.length})
            </h3>
          </div>

          <div className="space-y-3">
            {councils.map((c) => {
              const isSelected = selectedCouncil?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCouncil(c);
                    setSelectedDelib(null);
                  }}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-secondary/70 border-primary ring-1 ring-primary/40' : 'bg-card border-border hover:border-primary/40'}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-purple-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border">
                      {c.members?.length ?? 5} Agents
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.charter}</p>
                </div>
              );
            })}

            {councils.length === 0 && !councilsLoading && (
              <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3">
                <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs text-muted-foreground">No agent councils currently assembled.</p>
                <button
                  type="button"
                  onClick={() => createCouncilMutation.mutate()}
                  className="btn btn-outline text-xs gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Instantiate Architecture Council
                </button>
              </div>
            )}
          </div>

          {/* Deliberations list for selected council */}
          {selectedCouncil && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Deliberations ({deliberations.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setShowStartDelib(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  + New Deliberation
                </button>
              </div>

              <div className="space-y-2">
                {deliberations.map((d) => {
                  const isSel = selectedDelib?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDelib(d)}
                      className={`
                        p-3 rounded-lg border text-xs cursor-pointer transition-all
                        ${isSel ? 'bg-secondary border-primary' : 'bg-card/50 border-border hover:border-primary/40'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate max-w-[200px]">{d.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-primary">
                          {d.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{d.problem_statement}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Deliberation Chamber & Debate Trace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDelib ? (
            <div className="space-y-6">
              {/* Deliberation Header Card */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedDelib.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Stage: {selectedDelib.current_stage}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDelib.status !== 'RESOLVED' && selectedDelib.synthesis_proposal && (
                      <button
                        type="button"
                        onClick={() => ratifyMutation.mutate(selectedDelib.id)}
                        disabled={ratifyMutation.isPending}
                        className="btn btn-primary gap-1.5 text-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Ratify & Commit to Memory
                      </button>
                    )}
                    <span className="badge badge-success text-xs font-mono">{selectedDelib.status}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 text-xs">
                  <span className="font-semibold text-foreground uppercase tracking-wide block mb-1">
                    Problem Statement:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">{selectedDelib.problem_statement}</p>
                </div>
              </div>

              {/* Multi-Perspective Independent Reviews */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Independent Multi-Model Reviews ({selectedDelib.independent_reviews?.length ?? 0} Perspectives)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedDelib.independent_reviews?.map((rev, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div>
                          <h5 className="font-semibold text-foreground">{rev.role}</h5>
                          <span className="text-[10px] text-primary font-mono">{rev.model}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                          Conf: {Math.round((rev.confidence ?? 0.85) * 100)}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/80 block">
                          Perspective:
                        </span>
                        <p className="text-foreground font-medium mt-0.5">{rev.perspective}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground/80 block">
                          Proposal:
                        </span>
                        <p className="text-muted-foreground mt-0.5">{rev.proposal}</p>
                      </div>

                      {rev.risks?.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-400 block">
                            Identified Risks:
                          </span>
                          <ul className="list-disc list-inside text-muted-foreground mt-0.5 space-y-0.5">
                            {rev.risks.map((r, rIdx) => (
                              <li key={rIdx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Decision Proposal */}
              {selectedDelib.synthesis_proposal && (
                <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-4">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Sparkles className="h-4 w-4" />
                    <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">
                      Synthesis Agent Consensus Proposal
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <h5 className="font-bold text-foreground text-sm">
                        {selectedDelib.synthesis_proposal.title}
                      </h5>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        {selectedDelib.synthesis_proposal.synthesized_decision}
                      </p>
                    </div>

                    {selectedDelib.synthesis_proposal.consensus_points?.length > 0 && (
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
                        <span className="font-semibold text-purple-300 block mb-1 text-[11px]">
                          Points of Agreement:
                        </span>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                          {selectedDelib.synthesis_proposal.consensus_points.map((cp, idx) => (
                            <li key={idx}>{cp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disagreements & Dissent Preserved as Organizational Knowledge */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldAlert className="h-4 w-4" />
                    <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">
                      Disagreements Preserved as Knowledge ({selectedDelib.disagreements_recorded?.length ?? 0})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Immutable Dissent Record</span>
                </div>

                <div className="space-y-3">
                  {selectedDelib.disagreements_recorded?.map((dis, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border/50 bg-secondary/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{dis.topic}</span>
                        <span className="text-[10px] font-mono text-amber-400">
                          {dis.dissenting_models?.join(', ') || 'Multi-model dissent'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-2 rounded bg-black/20 border border-border/30">
                          <span className="text-[10px] font-mono text-muted-foreground block">Argument:</span>
                          <p className="text-muted-foreground mt-0.5">{dis.argument}</p>
                        </div>
                        <div className="p-2 rounded bg-black/20 border border-border/30">
                          <span className="text-[10px] font-mono text-muted-foreground block">Counter / Mitigation:</span>
                          <p className="text-muted-foreground mt-0.5">{dis.counter_argument || dis.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!selectedDelib.disagreements_recorded || selectedDelib.disagreements_recorded.length === 0) && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No unresolved dissent recorded for this deliberation.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border text-center space-y-3">
              <Scale className="h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">Select a Council & Deliberation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Convene multi-agent deliberation sessions across heterogeneous models (Claude, Gemini, OpenAI) to resolve complex architectural decisions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Deliberation */}
      {showStartDelib && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Initiate Council Deliberation</h3>
              <button
                type="button"
                onClick={() => setShowStartDelib(false)}
                className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Deliberation Topic / Title
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Cross-Region Failover Strategy"
                  value={delibTitle}
                  onChange={(e) => setDelibTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Problem Statement & Context
                </label>
                <textarea
                  rows={4}
                  className="input h-auto text-xs py-2"
                  placeholder="Detail the technical tradeoffs, constraints, and models involved..."
                  value={delibProblem}
                  onChange={(e) => setDelibProblem(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-purple-300 block">Participants Assembled:</span>
                <p>CTO (OpenAI), Architect (Claude 3.5 Sonnet), Backend Engineer (Gemini 1.5 Pro), Security Engineer (Claude Haiku), QA Lead (GPT-4o Mini).</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStartDelib(false)}
                className="btn btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => startDelibMutation.mutate()}
                disabled={startDelibMutation.isPending}
                className="btn btn-primary text-xs gap-1.5"
              >
                {startDelibMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Convene & Deliberate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
