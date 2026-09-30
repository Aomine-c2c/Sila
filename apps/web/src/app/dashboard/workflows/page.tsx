'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch,
  Play,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Bot,
  Wrench,
  Scale,
  RefreshCw,
  ChevronRight,
  X,
  FileCode,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import {
  workflowsApi,
  type Workflow,
  type WorkflowExecution,
  type WorkflowStep,
} from '@/lib/api/workflows';

const STEP_ICONS: Record<string, React.ElementType> = {
  AGENT: Bot,
  TOOL: Wrench,
  APPROVAL: Shield,
  RESOURCE_REQUEST: Zap,
  DECISION: Scale,
  ESCALATION: AlertTriangle,
  PARALLEL: Layers,
};

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-muted/50 text-muted-foreground border-border',
  RUNNING: 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse',
  WAITING_APPROVAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  WAITING_RETRY: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  ESCALATED: 'bg-red-500/10 text-red-400 border-red-500/30',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  CANCELLED: 'bg-muted/40 text-muted-foreground border-border',
};

// Canonical Software Requirement Pipeline Preset (Exact user prompt workflow)
const CANONICAL_SOFTWARE_PIPELINE: WorkflowStep[] = [
  { id: 's-1', name: 'Product Agent Analyzes Requirement', type: 'AGENT', config: { agent: 'Product Agent', instruction: 'Ingest requirement, evaluate domain constraints, and synthesize functional spec.' } },
  { id: 's-2', name: 'Architect Reviews Design', type: 'AGENT', config: { agent: 'Architect Agent', instruction: 'Review architectural tradeoffs, schema migrations, and ADRs.' } },
  { id: 's-3', name: 'CTO Approves Architecture', type: 'APPROVAL', config: { title: 'CTO Architectural Approval', risk_level: 'HIGH', action: 'APPROVE_ARCHITECTURE' } },
  { id: 's-4', name: 'Engineers Implement (Parallel)', type: 'PARALLEL', config: { tasks: [{ name: 'Backend Services' }, { name: 'Frontend Interface' }, { name: 'DB Migrations' }] } },
  { id: 's-5', name: 'QA Tests Implementation', type: 'TOOL', config: { tool_name: 'automated_test_suite_runner' } },
  { id: 's-6', name: 'Security Reviews Code', type: 'AGENT', config: { agent: 'Security Agent', instruction: 'Audit least privilege, SAST scans, and constitutional compliance.' } },
  { id: 's-7', name: 'Documentation Updates', type: 'AGENT', config: { agent: 'Doc Agent', instruction: 'Update API docs, OpenAPI specs, and system changelog.' } },
  { id: 's-8', name: 'Deployment Approval Gate', type: 'APPROVAL', config: { title: 'Production Release Sign-off', risk_level: 'CRITICAL', action: 'APPROVE_DEPLOYMENT' } },
  { id: 's-9', name: 'Production Deployment', type: 'TOOL', config: { tool_name: 'cloud_infra_deployer' } },
  { id: 's-10', name: 'Telemetry & SRE Monitoring', type: 'AGENT', config: { agent: 'SRE Monitoring Agent', instruction: 'Observe latency, error rates, and resource utilization.' } },
  { id: 's-11', name: 'Project Completion & Closeout', type: 'DECISION', config: { title: 'Project Verification & Delivery Sign-off', chosen_option: 'Verified Complete' } },
];

export default function WorkflowsDashboardPage() {
  const qc = useQueryClient();
  const { activeCompany } = useAuthStore();
  const companyId = activeCompany?.id;

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Workflow Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // 1. Fetch Workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', companyId],
    queryFn: () => workflowsApi.list(companyId!),
    enabled: !!companyId,
  });

  // 2. Fetch Executions for selected workflow
  const {
    data: executions = [],
    isLoading: executionsLoading,
    refetch: refetchExecutions,
  } = useQuery({
    queryKey: ['workflow-executions', companyId, selectedWorkflow?.id],
    queryFn: () => workflowsApi.listExecutions(companyId!, selectedWorkflow!.id),
    enabled: !!companyId && !!selectedWorkflow?.id,
    refetchInterval: 5000,
  });

  // 3. Create Canonical Pipeline Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      workflowsApi.create(companyId!, {
        name: newTitle || 'Software Delivery Pipeline',
        description: newDesc || 'Autonomous development lifecycle: requirement -> review -> approval -> deploy',
        trigger_type: 'EVENT',
        steps: CANONICAL_SOFTWARE_PIPELINE,
      }),
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflows', companyId] });
      setSelectedWorkflow(wf);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
    },
  });

  // 4. Trigger Execution Mutation
  const triggerMutation = useMutation({
    mutationFn: (wfId: string) =>
      workflowsApi.triggerExecution(companyId!, wfId, {
        title: `Run ${new Date().toLocaleTimeString()}`,
        input_payload: { requirement: 'Implement User Audit Stream', priority: 'HIGH' },
      }),
    onSuccess: (exec) => {
      qc.invalidateQueries({ queryKey: ['workflow-executions', companyId, selectedWorkflow?.id] });
      setSelectedExecution(exec);
    },
  });

  // 5. Resume Execution Mutation (after approval)
  const resumeMutation = useMutation({
    mutationFn: (execId: string) => workflowsApi.resumeExecution(companyId!, execId),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['workflow-executions', companyId, selectedWorkflow?.id] });
      setSelectedExecution(updated);
    },
  });

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-3 opacity-60" />
        <h2 className="text-lg font-bold text-foreground">No Organization Selected</h2>
        <p className="text-sm text-muted-foreground">Select an active company to manage and observe workflows.</p>
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
              Workflow Observability & Execution Engine
            </h1>
            <span className="badge badge-primary text-xs">Phase 9 Core</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Persisted, multi-step organizational workflows with approvals, retries, branching, and real-time state tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Main Grid: Workflows List (Left) + Visual Pipeline & Executions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workflows Roster */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Workflow Definitions ({workflows.length})
            </h3>
            {workflows.length === 0 && !workflowsLoading && (
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Seed Canonical Pipeline
              </button>
            )}
          </div>

          <div className="space-y-3">
            {workflows.map((wf) => {
              const isSelected = selectedWorkflow?.id === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => {
                    setSelectedWorkflow(wf);
                    setSelectedExecution(null);
                  }}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all duration-200
                    ${isSelected ? 'bg-secondary/70 border-primary ring-1 ring-primary/40' : 'bg-card border-border hover:border-primary/40'}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="text-sm font-semibold text-foreground">{wf.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary border border-border">
                      {wf.steps?.length ?? 0} Steps
                    </span>
                  </div>
                  {wf.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{wf.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                    <span>Trigger: {wf.trigger_type}</span>
                    <span className="text-emerald-400 font-mono">{wf.status}</span>
                  </div>
                </div>
              );
            })}

            {workflows.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-border text-center space-y-3">
                <GitBranch className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs text-muted-foreground">No workflows configured in this organization.</p>
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="btn btn-outline text-xs gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Instantiate Software Delivery Pipeline
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution View & Step Observability */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWorkflow ? (
            <div className="space-y-6">
              {/* Workflow Actions Header */}
              <div className="p-5 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {selectedWorkflow.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedWorkflow.description || 'Observable autonomous process'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerMutation.mutate(selectedWorkflow.id)}
                    disabled={triggerMutation.isPending}
                    className="btn btn-primary gap-2 text-xs"
                  >
                    {triggerMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" />
                    )}
                    Trigger Execution Run
                  </button>
                </div>
              </div>

              {/* Step Sequence Visualization (Step Pipeline) */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Orchestrated Execution Sequence ({selectedWorkflow.steps?.length ?? 0} Steps)
                </h4>

                <div className="overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex items-center gap-2 min-w-max">
                    {selectedWorkflow.steps?.map((st, idx) => {
                      const Icon = STEP_ICONS[st.type] || GitBranch;
                      const isCurrent = selectedExecution?.current_step_id === st.id;
                      return (
                        <React.Fragment key={st.id}>
                          <div
                            className={`
                              p-3 rounded-xl border flex flex-col gap-1 w-48 shrink-0 transition-all
                              ${isCurrent ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border/60 bg-secondary/30'}
                            `}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-[10px] text-muted-foreground">Step {idx + 1}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-primary">
                                {st.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                              <h5 className="text-xs font-semibold text-foreground truncate">{st.name}</h5>
                            </div>
                          </div>
                          {idx < selectedWorkflow.steps.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active & Historical Executions */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Execution History & Observability ({executions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => refetchExecutions()}
                    className="btn btn-ghost h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Refresh"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {executions.map((exec) => {
                    const isSelected = selectedExecution?.id === exec.id;
                    const badgeClass = STATUS_BADGES[exec.status] ?? 'bg-muted/50 text-muted-foreground';

                    return (
                      <div
                        key={exec.id}
                        onClick={() => setSelectedExecution(exec)}
                        className={`
                          p-4 rounded-xl border cursor-pointer transition-all duration-200
                          ${isSelected ? 'bg-secondary/70 border-primary ring-1 ring-primary/40' : 'bg-secondary/20 border-border/60 hover:border-primary/40'}
                        `}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-semibold text-foreground">{exec.title}</h5>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                                {exec.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Current Step: <span className="text-foreground font-medium">{exec.current_step_name || 'Completed'}</span> ({exec.current_step_index}/{exec.total_steps})
                            </p>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            {exec.status === 'WAITING_APPROVAL' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resumeMutation.mutate(exec.id);
                                }}
                                disabled={resumeMutation.isPending}
                                className="btn btn-primary text-xs h-7 px-2.5 gap-1"
                              >
                                <Shield className="h-3.5 w-3.5" />
                                Resume (Post-Approval)
                              </button>
                            )}
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {exec.duration_ms ? `${Math.round(exec.duration_ms)}ms` : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Step Records Drawer when Selected */}
                        {isSelected && exec.step_records?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                            <h6 className="text-[11px] font-mono uppercase text-muted-foreground font-semibold">
                              Observable Step Provenance Log
                            </h6>
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {exec.step_records.map((sr) => (
                                <div
                                  key={sr.id}
                                  className="flex items-center justify-between text-xs p-2 rounded bg-black/30 border border-border/40 font-mono"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-400">✓</span>
                                    <span className="text-foreground">{sr.step_name}</span>
                                    {sr.agent_name && (
                                      <span className="text-primary text-[10px]">[{sr.agent_name}]</span>
                                    )}
                                    {sr.tool_name && (
                                      <span className="text-yellow-400 text-[10px]">&lt;{sr.tool_name}&gt;</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                                    <span>{Math.round(sr.duration_ms)}ms</span>
                                    <span className="text-green-400 uppercase">{sr.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {executions.length === 0 && !executionsLoading && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No executions triggered yet. Click &quot;Trigger Execution Run&quot; above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-border text-center space-y-3">
              <Layers className="h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">Select a Workflow</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a workflow definition on the left to inspect its multi-step pipeline, trigger executions, and observe live step state.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Workflow */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Create Workflow</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="e.g. Software Delivery Pipeline"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="input h-auto text-xs py-2"
                  placeholder="Describe the multi-step automated process..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-primary block">Included Pipeline Stages:</span>
                <p>Requirement Ingestion → Architect Review → CTO Approval → Parallel Implementation → QA Testing → Security Review → Production Deployment → Completion Monitor.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="btn btn-primary text-xs gap-1.5"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create & Instantiate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
