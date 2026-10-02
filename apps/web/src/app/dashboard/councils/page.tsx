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
  ArrowDown,
  MessageSquare,
  Shield,
  ThumbsDown,
  Compass,
  Cpu,
  Check,
  Flame,
  Activity,
} from 'lucide-react';
import { useOrganizationContext } from '@/lib/organizationContext';
import {
  councilsApi,
  type AgentCouncil,
  type CouncilDeliberation,
  type CouncilMember,
  type ReviewItem,
  type DisagreementRecord,
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
    role_title: 'Architect',
    agent_name: 'Systems Architect Agent',
    perspective: 'Scalability, Modularity & Distributed Systems',
    model_identifier: 'claude-3-5-sonnet',
    model_provider: 'anthropic',
  },
  {
    role_title: 'Security',
    agent_name: 'Cybersecurity Agent',
    perspective: 'Zero-Trust, Attack Vectors & Compliance',
    model_identifier: 'claude-3-5-haiku',
    model_provider: 'anthropic',
  },
  {
    role_title: 'Backend',
    agent_name: 'Backend Engineering Agent',
    perspective: 'Implementation Complexity & Latency Budget',
    model_identifier: 'gemini-1.5-pro',
    model_provider: 'google',
  },
  {
    role_title: 'QA Lead',
    agent_name: 'Quality Assurance Agent',
    perspective: 'Testability, Chaos Tolerance & Edge Cases',
    model_identifier: 'gpt-4o-mini',
    model_provider: 'openai',
  },
];

type DeliberationSectionTab =
  | 'OVERVIEW'
  | 'PARTICIPANTS'
  | 'DISCUSSION'
  | 'EVIDENCE'
  | 'PROPOSALS'
  | 'OBJECTIONS'
  | 'SYNTHESIS'
  | 'DECISION';

export default function CouncilsDashboardPage() {
  const qc = useQueryClient();
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id;

  const [selectedCouncil, setSelectedCouncil] = useState<AgentCouncil | null>(null);
  const [selectedDelib, setSelectedDelib] = useState<CouncilDeliberation | null>(null);
  const [activeSection, setActiveSection] = useState<DeliberationSectionTab>('OVERVIEW');
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState<number>(0);

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

  // Automatically select first council & first deliberation if available
  React.useEffect(() => {
    if (councils.length > 0 && !selectedCouncil) {
      setSelectedCouncil(councils[0]);
    }
  }, [councils, selectedCouncil]);

  React.useEffect(() => {
    if (deliberations.length > 0 && !selectedDelib) {
      setSelectedDelib(deliberations[0]);
    }
  }, [deliberations, selectedDelib]);

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
      setActiveSection('OVERVIEW');
    },
  });

  // 5. Ratify Decision Mutation
  const ratifyMutation = useMutation({
    mutationFn: (delibId: string) =>
      councilsApi.ratifyDecision(companyId!, delibId, {
        decision:
          selectedDelib?.synthesis_proposal?.synthesized_decision ||
          'Ratified synthesized architectural consensus with fault-isolated adapters.',
        rationale: 'Ratified by supervisory executive from Architecture Deliberation Workspace.',
        record_in_memory: true,
      }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['council-deliberations', companyId, selectedCouncil?.id] });
      setSelectedDelib(updated);
      setActiveSection('DECISION');
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

  // Derive reviews & member lookup
  const reviews: ReviewItem[] = selectedDelib?.independent_reviews || [];
  const ctoReview = reviews.find((r) => r.role?.toLowerCase().includes('cto')) || reviews[0];
  const architectReview = reviews.find((r) => r.role?.toLowerCase().includes('architect')) || reviews[1];
  const securityReview = reviews.find((r) => r.role?.toLowerCase().includes('security')) || reviews[2];
  const backendReview = reviews.find((r) => r.role?.toLowerCase().includes('backend')) || reviews[3];

  const activeParticipant = reviews[selectedParticipantIndex] || reviews[0];
  const disagreements: DisagreementRecord[] = selectedDelib?.disagreements_recorded || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title & Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Agent Council & Deliberation Workspace
                </h1>
                <span className="badge badge-primary text-[10px] font-mono uppercase tracking-wider">
                  Structured Reasoning
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visualized multi-perspective agent deliberation mesh. Eliminates unstructured chat in favor of rigorous
                positioning, evidence inspection, explicit objections, and synthesis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (councils.length === 0) {
                createCouncilMutation.mutate();
              } else {
                setShowStartDelib(true);
              }
            }}
            disabled={createCouncilMutation.isPending || startDelibMutation.isPending}
            className="btn btn-primary gap-2 text-xs font-semibold shadow-sm hover:shadow"
          >
            {createCouncilMutation.isPending || startDelibMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {councils.length === 0 ? 'Convene Architecture Council' : 'New Deliberation'}
          </button>
        </div>
      </div>

      {/* Main 12-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (3.5 cols): Council Directory & Deliberation History */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Active Councils Card */}
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-[11px] font-mono uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Permanent Councils ({councils.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {councils.map((c) => {
                const isSelected = selectedCouncil?.id === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      setSelectedCouncil(c);
                      setSelectedDelib(null);
                    }}
                    className={`
                      w-full text-left p-2.5 rounded-xl border transition-all text-xs
                      ${isSelected ? 'bg-secondary border-primary/60 ring-1 ring-primary/40' : 'bg-card/50 border-border hover:border-primary/40'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{c.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-primary border border-border shrink-0">
                        {c.members?.length ?? 5} Agents
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{c.charter}</p>
                  </button>
                );
              })}

              {councils.length === 0 && !councilsLoading && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No permanent councils configured.
                </div>
              )}
            </div>
          </div>

          {/* Deliberations Selector */}
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-[11px] font-mono uppercase font-semibold text-muted-foreground flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-purple-400" /> Deliberations ({deliberations.length})
              </span>
              <button
                type="button"
                onClick={() => setShowStartDelib(true)}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                + Deliberate
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {deliberations.map((d) => {
                const isSel = selectedDelib?.id === d.id;
                const statusColor =
                  d.status === 'RESOLVED'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : d.status === 'SYNTHESIZED'
                      ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => {
                      setSelectedDelib(d);
                      setActiveSection('OVERVIEW');
                    }}
                    className={`
                      w-full text-left p-3 rounded-xl border text-xs transition-all
                      ${isSel ? 'bg-secondary border-primary ring-1 ring-primary/40' : 'bg-card/40 border-border hover:border-primary/40'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-semibold text-foreground truncate">{d.title}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${statusColor} shrink-0`}>
                        {d.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {d.problem_statement}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                      <span>Stage: {d.current_stage}</span>
                      <span>{d.independent_reviews?.length ?? 0} Voices</span>
                    </div>
                  </button>
                );
              })}

              {deliberations.length === 0 && !delibsLoading && (
                <div className="text-center py-6 text-xs text-muted-foreground space-y-2">
                  <p>No deliberations on record.</p>
                  <button
                    type="button"
                    onClick={() => setShowStartDelib(true)}
                    className="btn btn-outline text-xs w-full"
                  >
                    Start First Deliberation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Deliberation Workspace (8.5 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {selectedDelib ? (
            <div className="space-y-6">
              {/* Problem Statement & Deliberation Header */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground tracking-tight">{selectedDelib.title}</h2>
                      <span className="badge badge-outline text-[10px] font-mono">{selectedDelib.current_stage}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Convened Council: {selectedCouncil?.name || 'Architecture & Technical Governance Council'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedDelib.status !== 'RESOLVED' && selectedDelib.synthesis_proposal && (
                      <button
                        type="button"
                        onClick={() => ratifyMutation.mutate(selectedDelib.id)}
                        disabled={ratifyMutation.isPending}
                        className="btn btn-primary gap-1.5 text-xs font-semibold"
                      >
                        {ratifyMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        Ratify & Commit to Memory
                      </button>
                    )}
                    <span
                      className={`badge text-xs font-mono font-semibold ${selectedDelib.status === 'RESOLVED'
                          ? 'badge-success'
                          : selectedDelib.status === 'SYNTHESIZED'
                            ? 'badge-primary'
                            : 'badge-secondary'
                        }`}
                    >
                      {selectedDelib.status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 text-xs space-y-1">
                  <span className="font-semibold text-foreground uppercase tracking-wide text-[10px] text-muted-foreground">
                    Deliberation Problem Statement:
                  </span>
                  <p className="text-foreground leading-relaxed font-mono text-[12px] bg-secondary/40 p-2.5 rounded-lg border border-border/40">
                    {selectedDelib.problem_statement}
                  </p>
                </div>

                {/* VISUAL DELIBERATION TOPOLOGY WORKSPACE */}
                <div className="p-4 rounded-xl border border-border/70 bg-gradient-to-b from-secondary/40 to-card/90 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-primary" /> Visual Deliberation Mesh Topology
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">Heterogeneous Agent Mesh</span>
                  </div>

                  {/* Visual Topology Diagram */}
                  <div className="p-4 rounded-xl border border-border/80 bg-background/60 font-mono text-xs shadow-inner">
                    <div className="text-center font-bold text-foreground text-xs uppercase tracking-widest pb-3">
                      ARCHITECTURE COUNCIL
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 items-center max-w-xl mx-auto py-2">
                      {/* Top Pair: CTO <---> Architect */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-bold text-foreground">CTO</span>
                            <span className="block text-[9px] text-muted-foreground">OpenAI GPT-4o</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {Math.round((ctoReview?.confidence ?? 0.92) * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-400" />
                          <div>
                            <span className="font-bold text-foreground">Architect</span>
                            <span className="block text-[9px] text-muted-foreground">Claude 3.5 Sonnet</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {Math.round((architectReview?.confidence ?? 0.95) * 100)}%
                        </span>
                      </div>

                      {/* Bridge Line Indicator */}
                      <div className="col-span-1 md:col-span-2 flex items-center justify-center gap-2 text-muted-foreground text-[10px]">
                        <span className="h-px bg-border flex-1" />
                        <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                          Cross-Perspective Counter-Balancing
                        </span>
                        <span className="h-px bg-border flex-1" />
                      </div>

                      {/* Bottom Pair: Security <---> Backend */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-rose-400" />
                          <div>
                            <span className="font-bold text-foreground">Security</span>
                            <span className="block text-[9px] text-muted-foreground">Claude Haiku</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {Math.round((securityReview?.confidence ?? 0.9) * 100)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-blue-400" />
                          <div>
                            <span className="font-bold text-foreground">Backend</span>
                            <span className="block text-[9px] text-muted-foreground">Gemini 1.5 Pro</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {Math.round((backendReview?.confidence ?? 0.89) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Flow Down to Synthesis */}
                    <div className="flex flex-col items-center justify-center pt-2">
                      <div className="flex items-center gap-1 text-primary">
                        <ArrowDown className="h-4 w-4 animate-bounce" />
                      </div>
                      <div className="mt-1 px-4 py-2 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-300 font-bold text-center tracking-wider text-xs shadow-sm">
                        SYNTHESIS & RATIFIED CONSENSUS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STRUCTURED DELIBERATION STAGES TABS */}
              {/* Requirements: Discussion, Evidence, Proposals, Objections, Synthesis, Decision */}
              <div className="border-b border-border flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'OVERVIEW', label: 'Deliberation Overview', icon: Layers },
                  { id: 'PARTICIPANTS', label: 'Participants (5)', icon: Users },
                  { id: 'PROPOSALS', label: 'Proposals', icon: FileText },
                  { id: 'EVIDENCE', label: 'Evidence Matrix', icon: Compass },
                  { id: 'OBJECTIONS', label: 'Objections & Dissent', icon: ShieldAlert },
                  { id: 'DISCUSSION', label: 'Discussion Threads', icon: MessageSquare },
                  { id: 'SYNTHESIS', label: 'Consensus Synthesis', icon: Sparkles },
                  { id: 'DECISION', label: 'Final Decision', icon: CheckCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSection === tab.id;
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveSection(tab.id as DeliberationSectionTab)}
                      className={`
                        flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap
                        ${isActive
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                        }
                      `}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeSection === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Disagreements explicitly surfaced */}
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Flame className="h-4 w-4" />
                        <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                          Explicit Disagreements & Perspective Divergence ({disagreements.length})
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">Preserved In Organizational Memory</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      NEIMAN deliberations preserve divergence rather than forcing false uniformity. The following
                      disagreements were explicitly debated and mitigated:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {disagreements.map((dis, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-amber-500/20 bg-card/60 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-[11px] truncate">{dis.topic}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Dissenting: {dis.dissenting_agents?.join(', ')}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="p-2 rounded bg-black/20 border border-border/40 text-[11px]">
                              <span className="text-[9px] font-mono text-rose-400 block font-bold uppercase">
                                Objection / Argument:
                              </span>
                              <p className="text-muted-foreground mt-0.5">{dis.argument}</p>
                            </div>
                            <div className="p-2 rounded bg-black/20 border border-border/40 text-[11px]">
                              <span className="text-[9px] font-mono text-emerald-400 block font-bold uppercase">
                                Counter-Argument & Mitigation:
                              </span>
                              <p className="text-muted-foreground mt-0.5">
                                {dis.counter_argument || dis.mitigation}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {disagreements.length === 0 && (
                        <div className="col-span-2 text-center py-4 text-xs text-muted-foreground">
                          No unresolved disagreements recorded.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary of Synthesis & Final Decision */}
                  {selectedDelib.synthesis_proposal && (
                    <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-3">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Sparkles className="h-4 w-4" />
                        <h3 className="text-xs font-mono uppercase tracking-wider font-bold">
                          Synthesis Recommendation
                        </h3>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedDelib.synthesis_proposal.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedDelib.synthesis_proposal.synthesized_decision}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PARTICIPANTS (Structured review per participant) */}
              {/* Requirements: Each participant should have: position, evidence, confidence, concerns, recommendation */}
              {activeSection === 'PARTICIPANTS' && (
                <div className="space-y-6">
                  {/* Participant Switcher Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {reviews.map((rev, idx) => {
                      const isSel = selectedParticipantIndex === idx;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedParticipantIndex(idx)}
                          className={`
                            px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 shrink-0
                            ${isSel ? 'bg-secondary border-primary ring-1 ring-primary/40' : 'bg-card border-border hover:border-primary/40'}
                          `}
                        >
                          <Bot className="h-3.5 w-3.5 text-primary" />
                          <span>{rev.role}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            ({Math.round((rev.confidence ?? 0.85) * 100)}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detailed Structured Participant Card */}
                  {activeParticipant && (
                    <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <Bot className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-foreground">{activeParticipant.role}</h3>
                              <span className="badge badge-secondary text-[10px] font-mono">
                                {activeParticipant.model}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Agent: {activeParticipant.agent_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                              Confidence Rating
                            </span>
                            <span className="text-sm font-bold font-mono text-emerald-400">
                              {Math.round((activeParticipant.confidence ?? 0.85) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5 Specific Requirements: POSITION, EVIDENCE, CONFIDENCE, CONCERNS, RECOMMENDATION */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. POSITION */}
                        <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5" /> 1. Operational Position & Mandate
                          </span>
                          <p className="text-xs font-semibold text-foreground">{activeParticipant.perspective}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                            {activeParticipant.proposal}
                          </p>
                        </div>

                        {/* 2. EVIDENCE */}
                        <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5" /> 2. Empirical / Logical Evidence
                          </span>
                          <div className="space-y-1.5">
                            {activeParticipant.evidence?.map((ev, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2 rounded-lg bg-black/20 border border-border/40 text-xs text-muted-foreground flex items-start gap-2"
                              >
                                <Check className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. CONFIDENCE & ASSUMPTIONS */}
                        <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" /> 3. Confidence & Operating Assumptions
                          </span>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground pb-1">
                              <span>Assessed Model Confidence:</span>
                              <span className="font-mono font-bold text-foreground">
                                {Math.round((activeParticipant.confidence ?? 0.85) * 100)}%
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground block font-bold uppercase mt-1">
                              Key Assumptions:
                            </span>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-1">
                              {activeParticipant.assumptions?.map((ass, aIdx) => (
                                <li key={aIdx}>{ass}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* 4. CONCERNS & RISKS */}
                        <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> 4. Concerns & Identified Risks
                          </span>
                          <div className="space-y-1.5">
                            {activeParticipant.risks?.map((risk, rIdx) => (
                              <div
                                key={rIdx}
                                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2"
                              >
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 5. RECOMMENDATION & OBJECTIONS (Full Width) */}
                        <div className="col-span-1 md:col-span-2 p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> 5. Concrete Recommendation & Stance on Competing Views
                          </span>
                          <p className="text-xs text-foreground font-medium leading-relaxed">
                            {activeParticipant.proposal}
                          </p>
                          {activeParticipant.objections?.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1">
                                Standing Objections to Alternative Proposals:
                              </span>
                              <div className="space-y-1">
                                {activeParticipant.objections.map((obj, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2"
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                                    <span>{obj}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROPOSALS */}
              {activeSection === 'PROPOSALS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      Submitted Architectural Proposals ({reviews.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Independent proposals generated by council agents prior to cross-examination:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-3 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                              <h4 className="font-bold text-foreground">{r.role}</h4>
                              <span className="text-[10px] font-mono text-primary">{r.model}</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                              Confidence: {Math.round((r.confidence ?? 0.85) * 100)}%
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed font-medium">{r.proposal}</p>
                          <div className="pt-1">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground block font-bold">
                              Key Perspective:
                            </span>
                            <span className="text-xs text-muted-foreground">{r.perspective}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: EVIDENCE */}
              {activeSection === 'EVIDENCE' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                      <Compass className="h-4 w-4 text-blue-400" /> Grounded Empirical & Telemetry Evidence Matrix
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Telemetry, benchmark datasets, and formal analysis submitted by council members to substantiate
                      their positions:
                    </p>

                    <div className="space-y-3 pt-2">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-border/60 bg-secondary/20 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{r.role} Evidence Grounding</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{r.agent_name}</span>
                          </div>
                          <div className="space-y-1.5">
                            {r.evidence?.map((ev, eIdx) => (
                              <div
                                key={eIdx}
                                className="p-2.5 rounded-lg bg-black/20 border border-border/40 flex items-start gap-2.5 text-muted-foreground"
                              >
                                <span className="font-mono text-primary font-bold text-[10px] shrink-0">
                                  EV-{idx + 1}.{eIdx + 1}
                                </span>
                                <span>{ev}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: OBJECTIONS */}
              {activeSection === 'OBJECTIONS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 text-rose-400">
                        <ShieldAlert className="h-4 w-4" /> Explicit Standing Objections & Risks
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Non-Negotiable Boundaries
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Structured objections raised during cross-review that must be explicitly resolved or mitigated
                      before ratification:
                    </p>

                    <div className="space-y-3 pt-2">
                      {reviews.flatMap((r) =>
                        (r.objections || []).map((obj, oIdx) => (
                          <div
                            key={`${r.role}-${oIdx}`}
                            className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                                <ThumbsDown className="h-3.5 w-3.5 text-rose-400" />
                                Objection by {r.role}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">{r.model}</span>
                            </div>
                            <p className="text-foreground leading-relaxed">{obj}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DISCUSSION */}
              {activeSection === 'DISCUSSION' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Structured Deliberation Threads
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground">Iterative Exchange</span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Structured argumentation threads between agents resolving specific technical objections:
                    </p>

                    <div className="space-y-4 pt-2">
                      {((selectedDelib.discussion_threads as Array<{
                        topic: string;
                        original_objection: string;
                        raised_by: string;
                        responses: Array<{ respondent: string; argument: string }>;
                      }>) || []).map((thread, tIdx) => (
                        <div key={tIdx} className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-3 text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <span className="font-bold text-foreground text-sm">{thread.topic}</span>
                            <span className="text-[10px] font-mono text-primary">
                              Initiated by: {thread.raised_by}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-black/20 border border-border/40 text-rose-300">
                            <span className="text-[9px] font-mono uppercase text-rose-400 font-bold block mb-0.5">
                              Core Challenge:
                            </span>
                            <p>{thread.original_objection}</p>
                          </div>

                          <div className="space-y-2 pl-3 border-l-2 border-primary/40">
                            {thread.responses?.map((resp, rIdx) => (
                              <div key={rIdx} className="space-y-0.5">
                                <span className="font-mono text-[10px] font-bold text-primary">
                                  {resp.respondent}:
                                </span>
                                <p className="text-muted-foreground leading-relaxed">{resp.argument}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {(!selectedDelib.discussion_threads || selectedDelib.discussion_threads.length === 0) && (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          No deliberation threads active.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SYNTHESIS */}
              {activeSection === 'SYNTHESIS' && (
                <div className="space-y-4">
                  {selectedDelib.synthesis_proposal ? (
                    <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Sparkles className="h-5 w-5" />
                          <h3 className="text-sm font-mono uppercase tracking-wider font-bold">
                            Consensus Synthesis Engine Output
                          </h3>
                        </div>
                        <span className="badge badge-primary text-[10px] font-mono">Consensus Stage</span>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <h4 className="text-base font-bold text-foreground">
                            {selectedDelib.synthesis_proposal.title}
                          </h4>
                          <p className="text-muted-foreground mt-1 leading-relaxed text-sm">
                            {selectedDelib.synthesis_proposal.synthesized_decision}
                          </p>
                        </div>

                        {selectedDelib.synthesis_proposal.consensus_points?.length > 0 && (
                          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                            <span className="font-bold text-purple-300 text-xs block">
                              Points of Unified Consensus:
                            </span>
                            <ul className="space-y-1.5">
                              {selectedDelib.synthesis_proposal.consensus_points.map((cp, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                  <Check className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                                  <span>{cp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedDelib.synthesis_proposal.recommended_mitigations?.length > 0 && (
                          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                            <span className="font-bold text-foreground text-xs block">
                              Mitigations for Captured Dissent:
                            </span>
                            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                              {selectedDelib.synthesis_proposal.recommended_mitigations.map((rm, idx) => (
                                <li key={idx}>{rm}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      Consensus synthesis is pending completion.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: DECISION */}
              {activeSection === 'DECISION' && (
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-foreground">
                          Ratified Decision Record
                        </h3>
                      </div>
                      <span className="badge badge-success text-[10px] font-mono">
                        {selectedDelib.status === 'RESOLVED' ? 'Ratified & Permanent' : 'Pending Ratification'}
                      </span>
                    </div>

                    {selectedDelib.final_decision ? (
                      <div className="space-y-4 text-xs">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400 block mb-1">
                            Final Ratified Direction:
                          </span>
                          <p className="text-sm font-semibold text-foreground leading-relaxed">
                            {selectedDelib.final_decision}
                          </p>
                        </div>

                        {selectedDelib.decision_rationale && (
                          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground block">
                              Ratification Rationale:
                            </span>
                            <p className="text-muted-foreground leading-relaxed">{selectedDelib.decision_rationale}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground font-mono">
                          <span>Resolved At: {selectedDelib.resolved_at ? new Date(selectedDelib.resolved_at).toLocaleString() : 'N/A'}</span>
                          {selectedDelib.decision_id && (
                            <span>Linked Decision ID: {selectedDelib.decision_id}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <p className="text-xs text-muted-foreground">
                          This deliberation has not been ratified into permanent organizational memory yet.
                        </p>
                        {selectedDelib.synthesis_proposal && (
                          <button
                            type="button"
                            onClick={() => ratifyMutation.mutate(selectedDelib.id)}
                            disabled={ratifyMutation.isPending}
                            className="btn btn-primary text-xs gap-1.5"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Ratify Consensus Decision
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border text-center space-y-3">
              <Scale className="h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">Select a Council & Deliberation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Convene multi-agent deliberation sessions across heterogeneous models (Claude, Gemini, OpenAI) to
                resolve complex architectural decisions.
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
                <p>
                  CTO (OpenAI), Architect (Claude 3.5 Sonnet), Backend Engineer (Gemini 1.5 Pro), Security Engineer
                  (Claude Haiku), QA Lead (GPT-4o Mini).
                </p>
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
                className="btn btn-primary text-xs gap-1.5 font-semibold"
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
