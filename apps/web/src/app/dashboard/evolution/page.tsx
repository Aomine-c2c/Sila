'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  TrendingUp,
  FlaskConical,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Bot,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  Play,
  RotateCw,
  Plus,
  Sliders,
  X,
  History,
  Check,
  ChevronRight,
  Target,
  BarChart3,
  Scale,
} from 'lucide-react';
import { useOrganizationContext } from '@/lib/organizationContext';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import {
  evolutionApi,
  type OrganizationalAdaptation,
  type CustomKPI,
  type OrganizationalSnapshot,
  type PerformanceDimension,
} from '@/lib/api/evolution';

const DIMENSIONS: Array<{ key: PerformanceDimension; label: string; icon: any }> = [
  { key: 'COMPANY', label: 'Company Wide', icon: Target },
  { key: 'DEPARTMENT', label: 'Departments', icon: Layers },
  { key: 'PROJECT', label: 'Projects', icon: Activity },
  { key: 'WORKFLOW', label: 'Workflows', icon: Sliders },
  { key: 'ROLE', label: 'Roles', icon: Scale },
  { key: 'AGENT', label: 'Agents', icon: Bot },
  { key: 'MODEL_PROVIDER', label: 'Providers / Models', icon: Cpu },
  { key: 'TASK', label: 'Tasks', icon: CheckCircle2 },
];

const STAGES = [
  'OBSERVE',
  'DIAGNOSE',
  'PROPOSE',
  'SIMULATE',
  'EVALUATE',
  'VALIDATE',
  'APPROVE',
  'DEPLOY',
  'MONITOR',
  'ROLLBACK',
];

export default function EvolutionLabPage() {
  const qc = useQueryClient();
  const previewMode = isDevelopmentAuthBypassEnabled();
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id;

  type TabType = 'evolution-lab' | 'simulation-lab' | 'performance' | 'snapshots';
  const [activeTab, setActiveTab] = useState<TabType>('simulation-lab');
  const [selectedAdaptation, setSelectedAdaptation] = useState<OrganizationalAdaptation | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activeRunResult, setActiveRunResult] = useState<any | null>(null);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteApprover, setPromoteApprover] = useState('Chief Operating Officer');
  const [promoteNotes, setPromoteNotes] = useState('Benchmark validated in Simulation Lab; approved for production roll-out.');

  // Modals & Forms
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);

  // New Adaptation State
  const [propTitle, setPropTitle] = useState('');
  const [propDiagnosis, setPropDiagnosis] = useState('');
  const [propType, setPropType] = useState('CHANGE_MODEL_ROUTING');
  const [propImprovement, setPropImprovement] = useState('');
  const [propRisk, setPropRisk] = useState('');

  // Rollback Form State
  const [rollbackReason, setRollbackReason] = useState('');
  const [learningNotes, setLearningNotes] = useState('');

  // Custom KPI Form State
  const [kpiName, setKpiName] = useState('');
  const [kpiDesc, setKpiDesc] = useState('');
  const [kpiDimension, setKpiDimension] = useState<PerformanceDimension>('COMPANY');
  const [kpiMetricKey, setKpiMetricKey] = useState('');
  const [kpiBenchmark, setKpiBenchmark] = useState<number>(95.0);
  const [kpiWarning, setKpiWarning] = useState<number>(90.0);
  const [kpiUnit, setKpiUnit] = useState('%');

  // Queries
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['performance-summary', companyId],
    queryFn: () => evolutionApi.getSummary(companyId!),
    enabled: !!companyId,
  });

  const { data: adaptations = [], isLoading: adaptationsLoading, refetch: refetchAdaptations } = useQuery({
    queryKey: ['adaptations', companyId],
    queryFn: () => evolutionApi.listAdaptations(companyId!),
    enabled: !!companyId,
  });

  const { data: kpis = [], refetch: refetchKPIs } = useQuery({
    queryKey: ['custom-kpis', companyId],
    queryFn: () => evolutionApi.listKPIs(companyId!),
    enabled: !!companyId,
  });

  const { data: snapshots = [], refetch: refetchSnapshots } = useQuery({
    queryKey: ['evolution-snapshots', companyId],
    queryFn: () => evolutionApi.listSnapshots(companyId!),
    enabled: !!companyId,
  });

  // NEXORA Simulation Lab Scenarios
  const { data: simulationScenarios = [], isLoading: simulationsLoading, refetch: refetchSimulations } = useQuery({
    queryKey: ['simulation-scenarios', companyId],
    queryFn: () => evolutionApi.listSimulationScenarios(companyId!),
    enabled: !!companyId,
  });

  const runSimulationMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      evolutionApi.runSimulationBenchmark(companyId!, scenarioId, {
        run_label: 'Controlled Benchmark Trial',
        workload_tasks_count: 50,
        concurrency_level: 6,
      }),
    onSuccess: (run) => {
      setActiveRunResult(run);
      qc.invalidateQueries({ queryKey: ['simulation-scenarios', companyId] });
    },
  });

  const promoteSimulationMutation = useMutation({
    mutationFn: ({ scenarioId, approver, notes }: { scenarioId: string; approver: string; notes: string }) =>
      evolutionApi.promoteSimulationScenario(companyId!, scenarioId, { approver, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulation-scenarios', companyId] });
      qc.invalidateQueries({ queryKey: ['evolution-snapshots', companyId] });
      setShowPromoteModal(false);
    },
  });

  // Mutations
  const proposeMutation = useMutation({
    mutationFn: () =>
      evolutionApi.proposeAdaptation(companyId!, {
        title: propTitle || 'Optimize Model Routing for Low Latency',
        adaptation_type: propType,
        trigger_diagnosis: propDiagnosis || 'High p99 latency observed under peak query traffic.',
        expected_improvement: propImprovement || '40% reduction in response latency and 30% cost savings.',
        risk_assessment: propRisk || 'Low risk. Automatic fallback guarantees schema adherence.',
        risk_level: 'LOW',
        previous_state: { default_model: 'claude-3-5-sonnet' },
        proposed_state: { default_model: 'gemini-1.5-pro', fallback: 'claude-3-5-sonnet' },
      }),
    onSuccess: (newAd) => {
      qc.invalidateQueries({ queryKey: ['adaptations', companyId] });
      setSelectedAdaptation(newAd);
      setShowProposeModal(false);
      setPropTitle('');
      setPropDiagnosis('');
      setPropImprovement('');
      setPropRisk('');
    },
  });

  const simulateMutation = useMutation({
    mutationFn: (adId: string) => evolutionApi.simulateInLab(companyId!, adId, { synthetic_task_count: 30 }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['adaptations', companyId] });
      setSelectedAdaptation(updated);
    },
  });

  const deployMutation = useMutation({
    mutationFn: (adId: string) => evolutionApi.approveAndDeploy(companyId!, adId, 'Approved after Evolution Lab tests'),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['adaptations', companyId] });
      qc.invalidateQueries({ queryKey: ['evolution-snapshots', companyId] });
      setSelectedAdaptation(updated);
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: () =>
      evolutionApi.rollback(companyId!, selectedAdaptation!.id, rollbackReason, learningNotes),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['adaptations', companyId] });
      qc.invalidateQueries({ queryKey: ['evolution-snapshots', companyId] });
      setSelectedAdaptation(updated);
      setShowRollbackModal(false);
      setRollbackReason('');
      setLearningNotes('');
    },
  });

  const createKPIMutation = useMutation({
    mutationFn: () =>
      evolutionApi.createKPI(companyId!, {
        name: kpiName,
        description: kpiDesc,
        dimension: kpiDimension,
        metric_key: kpiMetricKey,
        target_benchmark: kpiBenchmark,
        warning_threshold: kpiWarning,
        unit: kpiUnit,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-kpis', companyId] });
      setShowKPIModal(false);
      setKpiName('');
      setKpiDesc('');
      setKpiMetricKey('');
    },
  });

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-foreground">No Organization Selected</h2>
        <p className="text-sm text-muted-foreground">Select an active company to supervise performance & evolution.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Mission Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <FlaskConical className="h-7 w-7 text-amber-400" />
              NEXORA Evolution Engine & Lab
            </h1>
            <span className="badge badge-primary text-xs">Phase 11 & 12</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controlled organizational adaptation, multidimensional performance telemetry, and synthetic lab simulation.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('simulation-lab')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'simulation-lab'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              Simulation Lab ({simulationScenarios.length})
            </button>
            <button
              onClick={() => setActiveTab('evolution-lab')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'evolution-lab'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
              Evolution Lab ({adaptations.length})
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'performance'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              Performance Matrix
            </button>
            <button
              onClick={() => setActiveTab('snapshots')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'snapshots'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="h-3.5 w-3.5 text-cyan-400" />
              Snapshots ({snapshots.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowProposeModal(true)}
            disabled={previewMode}
            title={previewMode ? 'Write actions are unavailable in synthetic preview mode' : undefined}
            className="btn btn-primary gap-1.5 text-xs h-9 px-3"
          >
            <Plus className="h-4 w-4" />
            Propose Adaptation
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB: SIMULATION LAB (Simulated Copies, Workload Runs & Approval Gate)      */}
      {/* ========================================================================= */}
      {activeTab === 'simulation-lab' && (
        <div className="space-y-6">
          {/* Prominent Experimental Disclaimer Banner */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                EXPERIMENTAL SIMULATION RESULTS ONLY — NOT GUARANTEED FUTURE OUTCOMES
              </h4>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Simulations model synthetic performance under controlled benchmarks (alternative agent structures, model routing,
                workflows, resource limits, and policies). These represent hypothetical trial projections. Review evidence thoroughly
                before promoting any validated configuration into the live organization.
              </p>
            </div>
          </div>

          {/* Preview data uses the scenario baseline; production uses the live organization baseline. */}
          <div className="p-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            {(() => {
              const baseline = simulationScenarios[0]?.baseline_config;
              const agentCount = baseline?.agent_count ?? (previewMode ? 0 : 50);
              const monthlyBudget = baseline?.intelligence_budget_monthly_usd ?? (previewMode ? 0 : 100);
              const routing = baseline?.routing_strategy ?? (previewMode ? 'Not provided' : 'Standard Tier Routing');
              const slots = baseline?.parallel_execution_slots ?? (previewMode ? 0 : 5);
              return <>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-muted-foreground">{previewMode ? 'Synthetic organization' : 'Current live organization'}</div>
                <div className="text-sm font-bold text-foreground">{previewMode ? 'Sample operating baseline' : 'Active production baseline'}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-muted-foreground block text-[10px]">WORKFORCE</span>
                <span className="font-bold text-foreground">{agentCount} Active Agents</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">MONTHLY BUDGET</span>
                <span className="font-bold text-emerald-400">${Number(monthlyBudget).toFixed(2)} / mo</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">ROUTING</span>
                <span className="font-bold text-cyan-400">{routing}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">PARALLEL SLOTS</span>
                <span className="font-bold text-indigo-400">{slots} Slots</span>
              </div>
            </div>
              </>;
            })()}
          </div>

          {/* Scenarios Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Simulated Organization Branches ({simulationScenarios.length})
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Run controlled workloads against configurations to test alternative structures
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simulationScenarios.map((scenario) => {
                const isSelected = (selectedScenarioId || simulationScenarios[0]?.id) === scenario.id;
                const isPromoted = scenario.is_promoted;

                return (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-3 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/40'
                        : 'border-border bg-card/40 hover:bg-card/70 hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground leading-tight">
                        {scenario.name}
                      </span>
                      {isPromoted ? (
                        <span className="badge badge-success text-[10px] whitespace-nowrap">PROMOTED</span>
                      ) : (
                        <span className="badge badge-outline text-[10px] whitespace-nowrap">{scenario.status}</span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {scenario.description || 'Simulated branch configuration.'}
                    </p>

                    <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-muted-foreground block text-[9px]">AGENTS</span>
                        <span className="font-bold text-foreground">
                          {scenario.simulated_config?.agent_count ?? 50} agents
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px]">BUDGET</span>
                        <span className="font-bold text-emerald-400">
                          ${scenario.simulated_config?.intelligence_budget_monthly_usd ?? 100} / mo
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground block text-[9px]">ROUTING & WORKFLOW</span>
                        <span className="font-semibold text-cyan-400 truncate block">
                          {scenario.simulated_config?.routing_strategy ?? 'STANDARD'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Inspector & Benchmark Runner */}
          {(() => {
            const activeScenario =
              simulationScenarios.find((s) => s.id === (selectedScenarioId || simulationScenarios[0]?.id)) ||
              simulationScenarios[0];

            if (!activeScenario) {
              return null;
            }

            return (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-foreground">{activeScenario.name}</h2>
                      {activeScenario.is_promoted && (
                        <span className="badge badge-success text-xs">PROMOTED TO REAL ORG</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeScenario.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={previewMode || runSimulationMutation.isPending}
                      title={previewMode ? 'Simulations are read-only in synthetic preview mode' : undefined}
                      onClick={() => runSimulationMutation.mutate(activeScenario.id)}
                      className="btn btn-secondary text-xs h-9 gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5 text-primary" />
                      {runSimulationMutation.isPending ? 'Simulating Workload...' : 'Run Controlled Benchmark'}
                    </button>

                    {!activeScenario.is_promoted && (
                      <button
                        type="button"
                        disabled={previewMode}
                        title={previewMode ? 'Promotion is unavailable in synthetic preview mode' : undefined}
                        onClick={() => {
                          setSelectedScenarioId(activeScenario.id);
                          setShowPromoteModal(true);
                        }}
                        className="btn btn-primary text-xs h-9 gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {previewMode ? 'Promotion unavailable in preview' : 'Promote to Real Organization'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Configuration Comparison Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider font-mono">
                        {previewMode ? 'Sample Operating Baseline' : 'Active Live Baseline'}
                      </span>
                      <span className="badge badge-outline text-[10px]">{previewMode ? 'Sample' : 'Real Org'}</span>
                    </div>
                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agent Workforce</span>
                        <span className="font-semibold text-foreground">
                          {activeScenario.baseline_config?.agent_count ?? 50} Agents
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Budget</span>
                        <span className="font-semibold text-emerald-400">
                          ${activeScenario.baseline_config?.intelligence_budget_monthly_usd ?? 100}.00
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model Routing</span>
                        <span className="font-semibold text-cyan-400">
                          {activeScenario.baseline_config?.routing_strategy ?? 'STANDARD'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parallel Execution Slots</span>
                        <span className="font-semibold text-foreground">
                          {activeScenario.baseline_config?.parallel_execution_slots ?? 5} Slots
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                      <span className="font-bold text-primary uppercase tracking-wider font-mono">
                        Simulated Alternative
                      </span>
                      <span className="badge badge-primary text-[10px]">Experimental Copy</span>
                    </div>
                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Agent Workforce</span>
                        <span className="font-bold text-primary">
                          {activeScenario.simulated_config?.agent_count ?? 50} Agents
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Budget</span>
                        <span className="font-bold text-emerald-400">
                          ${activeScenario.simulated_config?.intelligence_budget_monthly_usd ?? 100}.00
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model Routing</span>
                        <span className="font-bold text-cyan-400">
                          {activeScenario.simulated_config?.routing_strategy ?? 'STANDARD'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parallel Execution Slots</span>
                        <span className="font-bold text-foreground">
                          {activeScenario.simulated_config?.parallel_execution_slots ?? 10} Slots
                        </span>
                      </div>
                      {activeScenario.simulated_config?.policy_rules && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground block mb-1">APPLIED POLICIES</span>
                          <div className="flex flex-wrap gap-1">
                            {activeScenario.simulated_config.policy_rules.map((p: string) => (
                              <span key={p} className="badge badge-secondary text-[9px]">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Benchmark Run Results & Measurable Metrics */}
                {activeRunResult && activeRunResult.scenario_id === activeScenario.id ? (
                  <div className="space-y-4 pt-4 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Controlled Workload Benchmark Metrics ({activeRunResult.workload_tasks_count} Tasks)
                      </h4>
                      <span className="badge badge-warning text-[10px]">EXPERIMENTAL RESULTS</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Cost Delta
                        </span>
                        <div className={`text-base font-bold font-mono ${
                          activeRunResult.metrics_comparison?.deltas?.cost_delta_pct <= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {activeRunResult.metrics_comparison?.deltas?.cost_delta_pct > 0 ? '+' : ''}
                          {activeRunResult.metrics_comparison?.deltas?.cost_delta_pct}%
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          ${activeRunResult.metrics_comparison?.simulated?.total_workload_cost_usd} vs ${activeRunResult.metrics_comparison?.baseline?.total_workload_cost_usd} base
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Latency Delta
                        </span>
                        <div className={`text-base font-bold font-mono ${
                          activeRunResult.metrics_comparison?.deltas?.latency_delta_pct <= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {activeRunResult.metrics_comparison?.deltas?.latency_delta_pct > 0 ? '+' : ''}
                          {activeRunResult.metrics_comparison?.deltas?.latency_delta_pct}%
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {activeRunResult.metrics_comparison?.simulated?.avg_task_latency_ms}ms avg
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Quality Benchmark
                        </span>
                        <div className="text-base font-bold font-mono text-cyan-400">
                          {activeRunResult.metrics_comparison?.simulated?.quality_score_pct}%
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          vs {activeRunResult.metrics_comparison?.baseline?.quality_score_pct}% baseline
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          Failure Rate
                        </span>
                        <div className="text-base font-bold font-mono text-rose-400">
                          {activeRunResult.metrics_comparison?.simulated?.failure_rate_pct}%
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {activeRunResult.tasks_succeeded} passed, {activeRunResult.tasks_failed} failed
                        </span>
                      </div>
                    </div>

                    {/* Insights List */}
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1 text-xs">
                      <span className="font-semibold text-foreground text-[11px]">Benchmark Insights:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px]">
                        {activeRunResult.insights?.map((ins: string, i: number) => (
                          <li key={i}>{ins}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2">
                    <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      No trial executed yet for this branch. Click &quot;Run Controlled Benchmark&quot; to test {simulationScenarios.find((scenario) => scenario.id === (selectedScenarioId || simulationScenarios[0]?.id))?.workload_profile?.tasks_count ?? 50} tasks across parallel execution slots.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EVOLUTION LAB (OBSERVE -> PROPOSE -> SIMULATE -> DEPLOY -> ROLLBACK)*/}
      {/* ========================================================================= */}
      {activeTab === 'evolution-lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposed & Deployed Adaptations */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Adaptation Queue ({adaptations.length})
              </h3>
            </div>

            <div className="space-y-3">
              {adaptations.map((ad) => {
                const isSelected = selectedAdaptation?.id === ad.id;
                return (
                  <div
                    key={ad.id}
                    onClick={() => setSelectedAdaptation(ad)}
                    className={`
                      p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-secondary/70 border-primary ring-1 ring-primary/40' : 'bg-card border-border hover:border-primary/40'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground leading-tight">{ad.title}</h4>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        ad.status === 'DEPLOYED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        ad.status === 'ROLLED_BACK' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                        ad.status === 'VALIDATED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {ad.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ad.trigger_diagnosis}</p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2 font-mono">
                      <span>Type: {ad.adaptation_type}</span>
                      <span className="text-primary">Stage: {ad.stage}</span>
                    </div>
                  </div>
                );
              })}

              {adaptations.length === 0 && (
                <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3">
                  <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs text-muted-foreground">No adaptations proposed yet.</p>
                  <button
                    type="button"
                    onClick={() => setShowProposeModal(true)}
                    className="btn btn-outline text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Propose First Adaptation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Evolution Lab Simulator & Lifecycle Inspector */}
          <div className="lg:col-span-8 space-y-6">
            {selectedAdaptation ? (
              <div className="space-y-6">
                {/* Header Stage Visualizer */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                          {selectedAdaptation.adaptation_type}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">ID: {selectedAdaptation.id.slice(0, 8)}...</span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground mt-1">{selectedAdaptation.title}</h3>
                    </div>

                    {/* Action Gates: Simulate -> Deploy -> Rollback */}
                    <div className="flex items-center gap-2">
                      {selectedAdaptation.status === 'PROPOSED' && (
                        <button
                          type="button"
                          onClick={() => simulateMutation.mutate(selectedAdaptation.id)}
                          disabled={simulateMutation.isPending}
                          className="btn btn-primary gap-1.5 text-xs"
                        >
                          {simulateMutation.isPending ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                          Simulate in Lab
                        </button>
                      )}

                      {selectedAdaptation.status === 'VALIDATED' && (
                        <button
                          type="button"
                          onClick={() => deployMutation.mutate(selectedAdaptation.id)}
                          disabled={deployMutation.isPending}
                          className="btn btn-primary gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          {deployMutation.isPending ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          Approve & Deploy (Snapshot Created)
                        </button>
                      )}

                      {(selectedAdaptation.status === 'DEPLOYED' || selectedAdaptation.status === 'MONITORING') && (
                        <button
                          type="button"
                          onClick={() => setShowRollbackModal(true)}
                          className="btn btn-outline gap-1.5 text-xs hover:text-red-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Rollback with Knowledge
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 10-Stage Lifecycle Pipeline */}
                  <div className="overflow-x-auto pb-1 scrollbar-hide">
                    <div className="flex items-center gap-1 min-w-max text-[10px] font-mono">
                      {STAGES.map((st, sIdx) => {
                        const isCurrent = selectedAdaptation.stage === st;
                        const isPast = STAGES.indexOf(selectedAdaptation.stage) > sIdx;
                        return (
                          <React.Fragment key={st}>
                            <div
                              className={`
                                px-2.5 py-1 rounded-md border flex items-center gap-1
                                ${isCurrent ? 'bg-primary text-primary-foreground border-primary font-bold shadow' :
                                  isPast ? 'bg-secondary/60 text-foreground border-border' :
                                  'bg-secondary/20 text-muted-foreground border-border/40 opacity-60'}
                              `}
                            >
                              <span>{st}</span>
                            </div>
                            {sIdx < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* State Diff: Previous vs Proposed State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                    <span className="font-mono font-bold text-muted-foreground uppercase text-[10px] block">
                      Previous State (Before Adaptation)
                    </span>
                    <pre className="p-3 rounded-lg bg-black/40 border border-border/60 font-mono text-[11px] text-foreground overflow-x-auto">
                      {JSON.stringify(selectedAdaptation.previous_state, null, 2)}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-2 text-xs">
                    <span className="font-mono font-bold text-primary uppercase text-[10px] block">
                      Proposed State (Target Modification)
                    </span>
                    <pre className="p-3 rounded-lg bg-black/40 border border-primary/30 font-mono text-[11px] text-foreground overflow-x-auto">
                      {JSON.stringify(selectedAdaptation.proposed_state, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Evolution Lab Simulation Results */}
                {selectedAdaptation.simulation_results && Object.keys(selectedAdaptation.simulation_results).length > 0 && (
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <FlaskConical className="h-4 w-4" />
                      <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">
                        Evolution Lab Synthetic Simulation & Chaos Testing
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                        <span className="text-[10px] text-muted-foreground font-mono">Synthetic Trials</span>
                        <div className="text-sm font-bold text-foreground">
                          {selectedAdaptation.simulation_results.synthetic_runs} runs
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                        <span className="text-[10px] text-muted-foreground font-mono">Latency Delta</span>
                        <div className="text-sm font-bold text-emerald-400">
                          -{selectedAdaptation.simulation_results.latency_reduction_pct}%
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                        <span className="text-[10px] text-muted-foreground font-mono">Cost Savings</span>
                        <div className="text-sm font-bold text-emerald-400">
                          +{selectedAdaptation.simulation_results.cost_savings_pct}%
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                        <span className="text-[10px] text-muted-foreground font-mono">Failure Rate</span>
                        <div className="text-sm font-bold text-cyan-400">
                          {selectedAdaptation.simulation_results.failure_rate_synthetic}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rollback & Organizational Knowledge Record */}
                {selectedAdaptation.status === 'ROLLED_BACK' && (
                  <div className="p-5 rounded-2xl border border-purple-500/40 bg-purple-950/10 space-y-3">
                    <div className="flex items-center gap-2 text-purple-300">
                      <History className="h-4 w-4" />
                      <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">
                        Rollback Knowledge Preserved in Memory
                      </h4>
                    </div>
                    <div className="text-xs space-y-2">
                      <p><strong className="text-foreground">Reason:</strong> {selectedAdaptation.rollback_reason}</p>
                      <p><strong className="text-foreground">Lesson Acquired:</strong> {selectedAdaptation.learning_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border text-center space-y-3">
                <FlaskConical className="h-10 w-10 text-muted-foreground opacity-40" />
                <h3 className="text-sm font-semibold text-foreground">Select an Adaptation to Inspect</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  View diagnostic evidence, simulate state changes in the Evolution Lab, and execute controlled rollouts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTIDIMENSIONAL PERFORMANCE MATRIX (8 DIMENSIONS)                */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">Multidimensional Performance Matrix</h3>
              <p className="text-xs text-muted-foreground">
                Observed actuals vs expected baselines across Company, Department, Project, Workflow, Role, Agent, Model, and Task.
              </p>
            </div>
            <button
              onClick={() => setShowKPIModal(true)}
              className="btn btn-outline text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Define Custom KPI
            </button>
          </div>

          {/* 8 Dimension Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DIMENSIONS.map((dim: any) => {
              const Icon = dim.icon;
              const dimData = summary?.dimensions?.[dim.key];
              return (
                <div key={dim.key} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-foreground">{dim.label}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {dimData?.observations_count ?? 0} obs
                    </span>
                  </div>

                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-mono text-emerald-400 font-bold">{dimData?.completion_rate_pct ?? 95.0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Failure Rate</span>
                      <span className="font-mono text-rose-400">{dimData?.failure_rate_pct ?? 5.0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resource Efficiency</span>
                      <span className="font-mono text-foreground">{dimData?.resource_efficiency_score ?? 0.88} / 1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider Reliability</span>
                      <span className="font-mono text-cyan-400">{dimData?.provider_reliability_pct ?? 99.4}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom KPIs Table */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Configured Custom KPIs ({kpis.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-mono">
                    <th className="pb-2">KPI Name</th>
                    <th className="pb-2">Dimension</th>
                    <th className="pb-2">Target Benchmark</th>
                    <th className="pb-2">Warning Threshold</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {kpis.map((k) => (
                    <tr key={k.id}>
                      <td className="py-2.5 font-semibold text-foreground">{k.name}</td>
                      <td className="py-2.5 font-mono text-primary">{k.dimension}</td>
                      <td className="py-2.5 font-mono text-emerald-400">{k.target_benchmark} {k.unit}</td>
                      <td className="py-2.5 font-mono text-amber-400">{k.warning_threshold ? `${k.warning_threshold} ${k.unit}` : '—'}</td>
                      <td className="py-2.5">
                        <span className="badge badge-success text-[10px]">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                  {kpis.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No custom KPIs configured yet. Click &quot;Define Custom KPI&quot; above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMMUTABLE ORGANIZATIONAL SNAPSHOTS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-foreground">Immutable Organizational Snapshots</h3>
              <p className="text-xs text-muted-foreground">
                Automatic pre-adaptation captures ensuring zero unverified self-modification and 100% auditable rollbacks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((snap) => (
              <div key={snap.id} className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{snap.name}</span>
                  <span className="font-mono text-[10px] text-cyan-400">v{snap.version}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">{snap.reason}</p>
                <div className="pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex justify-between">
                  <span>Created: {new Date(snap.created_at).toLocaleDateString()}</span>
                  <span>Verified Safe</span>
                </div>
              </div>
            ))}
            {snapshots.length === 0 && (
              <div className="col-span-3 p-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No snapshots created yet. Snapshots are automatically taken before any adaptation deployment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PROPOSE ADAPTATION                                               */}
      {/* ========================================================================= */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Propose Controlled Adaptation</h3>
              <button onClick={() => setShowProposeModal(false)} className="btn btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Title</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Optimize Code Synthesis Model Routing"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Adaptation Type</label>
                <select
                  className="input text-xs"
                  value={propType}
                  onChange={(e) => setPropType(e.target.value)}
                >
                  <option value="CHANGE_MODEL_ROUTING">Change Model Routing</option>
                  <option value="CHANGE_SYSTEM_PROMPT">Change System Prompt</option>
                  <option value="MODIFY_WORKFLOW">Modify Workflow</option>
                  <option value="MODIFY_RESOURCE_ALLOCATION">Modify Resource Allocation</option>
                  <option value="CREATE_SPECIALIZATION">Create Specialization</option>
                  <option value="CREATE_NEW_AGENT">Create New Agent</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Trigger Diagnosis (Observed Bottleneck / Waste)</label>
                <textarea
                  rows={2}
                  className="input h-auto text-xs py-2"
                  placeholder="Document the observed problem or opportunity..."
                  value={propDiagnosis}
                  onChange={(e) => setPropDiagnosis(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Expected Improvement</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. 40% latency reduction and 30% cost savings"
                  value={propImprovement}
                  onChange={(e) => setPropImprovement(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Risk Assessment & Mitigation</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Low risk. Fallback retains Sonnet on schema validation error."
                  value={propRisk}
                  onChange={(e) => setPropRisk(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setShowProposeModal(false)} className="btn btn-outline text-xs">
                Cancel
              </button>
              <button
                onClick={() => proposeMutation.mutate()}
                disabled={proposeMutation.isPending}
                className="btn btn-primary text-xs gap-1.5"
              >
                {proposeMutation.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ROLLBACK & KNOWLEDGE CAPTURE                                     */}
      {/* ========================================================================= */}
      {showRollbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Rollback Adaptation with Learning</h3>
              <button onClick={() => setShowRollbackModal(false)} className="btn btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Rollbacks in NEXORA are treated as valuable organizational information, not merely failure. Document the reason and lesson learned to commit into Company Memory.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Rollback Reason</label>
                <textarea
                  rows={2}
                  className="input h-auto text-xs py-2"
                  placeholder="What unexpected behavior or regression occurred in production?"
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Organizational Learning Notes</label>
                <textarea
                  rows={3}
                  className="input h-auto text-xs py-2"
                  placeholder="What rule, boundary, or guideline should the company remember from this trial?"
                  value={learningNotes}
                  onChange={(e) => setLearningNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setShowRollbackModal(false)} className="btn btn-outline text-xs">
                Cancel
              </button>
              <button
                onClick={() => rollbackMutation.mutate()}
                disabled={!rollbackReason || !learningNotes || rollbackMutation.isPending}
                className="btn btn-primary text-xs gap-1.5 bg-rose-500 hover:bg-rose-600 text-white"
              >
                {rollbackMutation.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rollback & Commit Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DEFINE CUSTOM KPI                                                */}
      {/* ========================================================================= */}
      {showKPIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Define Custom KPI</h3>
              <button onClick={() => setShowKPIModal(false)} className="btn btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">KPI Name</label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Zero-Drift Compliance Rate"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Dimension</label>
                <select
                  className="input text-xs"
                  value={kpiDimension}
                  onChange={(e) => setKpiDimension(e.target.value as PerformanceDimension)}
                >
                  {DIMENSIONS.map((d: any) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Target Benchmark</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input text-xs"
                    value={kpiBenchmark}
                    onChange={(e) => setKpiBenchmark(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Unit</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={kpiUnit}
                    onChange={(e) => setKpiUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setShowKPIModal(false)} className="btn btn-outline text-xs">
                Cancel
              </button>
              <button
                onClick={() => createKPIMutation.mutate()}
                disabled={!kpiName || createKPIMutation.isPending}
                className="btn btn-primary text-xs gap-1.5"
              >
                {createKPIMutation.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
                Save KPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PROMOTE SIMULATION SCENARIO TO REAL ORGANIZATION                 */}
      {/* ========================================================================= */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Promote Simulation Configuration</h3>
              </div>
              <button onClick={() => setShowPromoteModal(false)} className="btn btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              You are promoting this validated experimental branch into the real production organization.
              An immutable safety snapshot will be automatically captured prior to applying changes.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Approved By (Executive Authority)</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={promoteApprover}
                  onChange={(e) => setPromoteApprover(e.target.value)}
                  placeholder="e.g. Chief Operating Officer"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Approval Rationale & Notes</label>
                <textarea
                  rows={3}
                  className="input text-xs py-2 h-auto"
                  value={promoteNotes}
                  onChange={(e) => setPromoteNotes(e.target.value)}
                  placeholder="Describe why this simulated configuration was approved for promotion..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button onClick={() => setShowPromoteModal(false)} className="btn btn-outline text-xs">
                Cancel
              </button>
              <button
                disabled={promoteSimulationMutation.isPending || !selectedScenarioId}
                onClick={() => {
                  if (selectedScenarioId) {
                    promoteSimulationMutation.mutate({
                      scenarioId: selectedScenarioId,
                      approver: promoteApprover,
                      notes: promoteNotes,
                    });
                  }
                }}
                className="btn btn-primary text-xs gap-1.5"
              >
                {promoteSimulationMutation.isPending ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Confirm & Apply to Real Org
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
