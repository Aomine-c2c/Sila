'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Shield,
  Activity,
  Zap,
  Brain,
  MessageSquare,
  Play,
  Share2,
  AlertTriangle,
  History,
  X,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { agentsApi, type AgentProfile, type TaskExecutionResult } from '@/lib/api/agents';

interface AgentProfileDrawerProps {
  companyId: string;
  agentId: string;
  onClose: () => void;
  allAgents: Array<{ id: string; name: string }>;
}

export function AgentProfileDrawer({
  companyId,
  agentId,
  onClose,
  allAgents,
}: AgentProfileDrawerProps) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'execution' | 'messages' | 'memory' | 'audits'>('profile');

  // Execution state
  const [taskIdInput, setTaskIdInput] = useState('');
  const [execPayload, setExecPayload] = useState('{"mode": "automated"}');
  const [executionResult, setExecutionResult] = useState<TaskExecutionResult | null>(null);

  // Communication state
  const [targetAgentId, setTargetAgentId] = useState('');
  const [msgType, setMsgType] = useState('REQUEST');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Delegation state
  const [delegatedTaskId, setDelegatedTaskId] = useState('');
  const [delegateInstructions, setDelegateInstructions] = useState('');

  // Escalation state
  const [escalationProblem, setEscalationProblem] = useState('');

  // Load rich agent profile
  const { data: profile, isLoading, error } = useQuery<AgentProfile>({
    queryKey: ['agent-profile', companyId, agentId],
    queryFn: () => agentsApi.getProfile(companyId, agentId),
    enabled: !!companyId && !!agentId,
    refetchInterval: 10_000,
  });

  // Status transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      agentsApi.transitionStatus(companyId, agentId, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-profile', companyId, agentId] });
      qc.invalidateQueries({ queryKey: ['agents', companyId] });
    },
  });

  // Task execution mutation
  const executeMutation = useMutation({
    mutationFn: async () => {
      let parsed = {};
      try {
        parsed = JSON.parse(execPayload);
      } catch {
        // fallback
      }
      return agentsApi.executeTask(companyId, agentId, {
        task_id: taskIdInput,
        input_data: parsed,
      });
    },
    onSuccess: (data) => {
      setExecutionResult(data);
      qc.invalidateQueries({ queryKey: ['agent-profile', companyId, agentId] });
      qc.invalidateQueries({ queryKey: ['agents', companyId] });
    },
  });

  // Message mutation
  const sendMessageMutation = useMutation({
    mutationFn: () =>
      agentsApi.sendMessage(companyId, agentId, {
        to_agent_id: targetAgentId || undefined,
        message_type: msgType,
        subject: msgSubject,
        body: msgBody,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-profile', companyId, agentId] });
      setMsgSubject('');
      setMsgBody('');
    },
  });

  // Delegate mutation
  const delegateMutation = useMutation({
    mutationFn: () =>
      agentsApi.delegateTask(companyId, agentId, {
        to_agent_id: targetAgentId,
        task_id: delegatedTaskId,
        instructions: delegateInstructions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-profile', companyId, agentId] });
      setDelegatedTaskId('');
      setDelegateInstructions('');
    },
  });

  // Escalate mutation
  const escalateMutation = useMutation({
    mutationFn: () =>
      agentsApi.escalateProblem(companyId, agentId, {
        problem: escalationProblem,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-profile', companyId, agentId] });
      setEscalationProblem('');
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-nexora-surface border-l border-border shadow-2xl p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-nexora-surface border-l border-border shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-red-400">Failed to load agent</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Unable to fetch profile telemetry.</p>
      </div>
    );
  }

  const otherAgents = allAgents.filter((a) => a.id !== agentId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-nexora-surface border-l border-border shadow-2xl flex flex-col animate-fade-in backdrop-blur-xl">
      {/* Drawer Header */}
      <div className="p-6 border-b border-border/80 flex items-start justify-between bg-card/40">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
              <span className="badge badge-primary text-xs">{profile.autonomy}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profile.role_title || 'Autonomous Specialist'} • {profile.department_name || 'Organization Core'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                profile.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                profile.status === 'WORKING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                profile.status === 'BLOCKED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-muted/40 text-muted-foreground border border-border'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {profile.status}
              </span>

              {/* Status Switcher Dropdown */}
              <div className="relative group">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-2 ml-2"
                >
                  Change Status <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute left-0 mt-1 w-36 hidden group-hover:block bg-card border border-border rounded-lg shadow-xl py-1 z-30">
                  {['AVAILABLE', 'WORKING', 'BLOCKED', 'PAUSED', 'CONFIGURED', 'RETIRED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={st === profile.status || transitionMutation.isPending}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors disabled:opacity-40"
                      onClick={() => transitionMutation.mutate({ status: st, reason: 'Operator requested state transition' })}
                    >
                      Set {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-colors"
          aria-label="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60 bg-card/20 px-6 gap-2 overflow-x-auto text-xs font-medium">
        {[
          { id: 'profile', label: 'Employee Profile', icon: Bot },
          { id: 'execution', label: '10-Step Execution', icon: Play },
          { id: 'messages', label: 'Communications & Collab', icon: MessageSquare },
          { id: 'memory', label: 'Knowledge & Memory', icon: Brain },
          { id: 'audits', label: 'Audit Trail', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
                active
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: FULL PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hierarchy & Reporting */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                <span className="text-xs text-muted-foreground">Reporting Manager</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {profile.manager_name || 'Executive Direct (Self-governing)'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                <span className="text-xs text-muted-foreground">Intelligence Provider</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {String(profile.intelligence_config?.provider || 'Decoupled Mesh')} • {String(profile.intelligence_config?.model || 'gpt-4o')}
                </p>
              </div>
            </div>

            {/* System Instructions */}
            {profile.system_instructions && (
              <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  System Instructions & Persona
                </h4>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-mono bg-nexora-dark/50 p-3 rounded-lg border border-border/40">
                  {profile.system_instructions}
                </p>
              </div>
            )}

            {/* Responsibilities & Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Key Responsibilities
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {profile.responsibilities.length > 0 ? (
                    profile.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic">None assigned</li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Active Goals & OKRs
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground/90">
                  {profile.goals.length > 0 ? (
                    profile.goals.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{g}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground italic">No goals active</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Tool & Permission Boundaries */}
            <div className="p-4 rounded-xl border border-border/60 bg-card/40">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Capability-Based Permissions & Tool Whitelist
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.capabilities.map((cap) => (
                  <span key={cap} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                    <Shield className="h-3 w-3" />
                    {cap}
                  </span>
                ))}
                {profile.tools.map((t, idx) => {
                  const name = typeof t === 'string' ? t : (t.name as string);
                  return (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/80 border border-border text-xs text-foreground">
                      <Zap className="h-3 w-3 text-yellow-400" />
                      tool: {name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Resource Limits & Real-Time Consumption */}
            <div className="p-4 rounded-xl border border-border/60 bg-card/40 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Organizational Resource Usage
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-nexora-dark/60 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Total Tokens</span>
                  <p className="text-base font-bold text-foreground mt-1">
                    {Number(profile.resource_usage?.total_tokens || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-nexora-dark/60 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Cumulative Spend</span>
                  <p className="text-base font-bold text-green-400 mt-1">
                    ${Number(profile.resource_usage?.total_cost_usd || 0).toFixed(4)}
                  </p>
                </div>
                <div className="bg-nexora-dark/60 p-3 rounded-xl border border-border/40">
                  <span className="text-xs text-muted-foreground">Success Rate</span>
                  <p className="text-base font-bold text-primary mt-1">
                    {Math.round(Number(profile.performance_metadata?.success_rate || 1) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 10-STEP EXECUTION ENGINE */}
        {activeTab === 'execution' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Play className="h-4 w-4" />
                10-Step Autonomous Task Execution Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Executes tasks with full provenance: TASK RECEIVED → CONTEXT ASSEMBLY → PLAN → RESOURCE CHECK → INTELLIGENCE SELECTION → TOOL EXECUTION → RESULT → VALIDATION → REPORT → MEMORY UPDATE.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Task ID or Assigned Task UUID
                </label>
                <input
                  type="text"
                  placeholder="Paste task uuid (e.g. from seeded projects)"
                  value={taskIdInput}
                  onChange={(e) => setTaskIdInput(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Input Payload (JSON)
                </label>
                <textarea
                  rows={2}
                  value={execPayload}
                  onChange={(e) => setExecPayload(e.target.value)}
                  className="input text-xs font-mono"
                />
              </div>

              <button
                type="button"
                disabled={!taskIdInput || executeMutation.isPending}
                onClick={() => executeMutation.mutate()}
                className="btn btn-primary w-full gap-2 text-xs"
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing 10-Step Lifecycle…
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Autonomous Execution
                  </>
                )}
              </button>
            </div>

            {/* Execution Steps Trace */}
            {executionResult && (
              <div className="space-y-3 p-4 rounded-xl border border-border bg-card/60">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Execution {executionResult.execution_id.slice(0, 8)} Passed
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Duration: {Math.round(executionResult.total_duration_ms)}ms • Cost: ${executionResult.cost_usd.toFixed(4)}
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  {executionResult.steps.map((st, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-nexora-dark/40 border border-border/40 text-xs">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{st.step}</span>
                          <span className="text-muted-foreground">{Math.round(st.duration_ms)}ms</span>
                        </div>
                        <pre className="mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap font-mono">
                          {JSON.stringify(st.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRUCTURED COMMUNICATIONS & COLLABORATION */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Actions: Delegate & Escalate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delegation Box */}
              <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  Delegate Task to Peer
                </h4>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="input text-xs"
                >
                  <option value="">Select target employee…</option>
                  {otherAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Task ID"
                  value={delegatedTaskId}
                  onChange={(e) => setDelegatedTaskId(e.target.value)}
                  className="input text-xs"
                />
                <input
                  type="text"
                  placeholder="Delegation Instructions"
                  value={delegateInstructions}
                  onChange={(e) => setDelegateInstructions(e.target.value)}
                  className="input text-xs"
                />
                <button
                  type="button"
                  disabled={!targetAgentId || !delegatedTaskId || delegateMutation.isPending}
                  onClick={() => delegateMutation.mutate()}
                  className="btn btn-outline w-full text-xs"
                >
                  {delegateMutation.isPending ? 'Delegating…' : 'Dispatch Delegation'}
                </button>
              </div>

              {/* Escalation Box */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Escalate Problem to Manager
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Transitions agent status to BLOCKED and notifies supervisor.
                </p>
                <textarea
                  rows={2}
                  placeholder="Describe blocker, resource shortage, or violation…"
                  value={escalationProblem}
                  onChange={(e) => setEscalationProblem(e.target.value)}
                  className="input text-xs resize-none"
                />
                <button
                  type="button"
                  disabled={!escalationProblem || escalateMutation.isPending}
                  onClick={() => escalateMutation.mutate()}
                  className="btn btn-destructive w-full text-xs"
                >
                  {escalateMutation.isPending ? 'Escalating…' : 'Escalate to Manager'}
                </button>
              </div>
            </div>

            {/* Direct Message Form */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Dispatch Structured Message
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value)}
                  className="input text-xs"
                >
                  <option value="REQUEST">REQUEST</option>
                  <option value="RESPONSE">RESPONSE</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="NOTIFICATION">NOTIFICATION</option>
                </select>
                <select
                  value={targetAgentId}
                  onChange={(e) => setTargetAgentId(e.target.value)}
                  className="input text-xs"
                >
                  <option value="">Broadcast or Select Peer…</option>
                  {otherAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Subject"
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                className="input text-xs"
              />
              <textarea
                rows={2}
                placeholder="Communication body…"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                className="input text-xs"
              />
              <button
                type="button"
                disabled={!msgSubject || !msgBody || sendMessageMutation.isPending}
                onClick={() => sendMessageMutation.mutate()}
                className="btn btn-primary w-full text-xs gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                Send Structured Dispatch
              </button>
            </div>

            {/* Recent Message History */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Dispatches & Inbound Telemetry
              </h4>
              {profile.recent_communications.length > 0 ? (
                profile.recent_communications.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg border border-border/50 bg-card/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{c.subject}</span>
                      <span className="badge badge-default text-[10px]">{c.type}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Time: {new Date(c.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No communication logs recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE & MEMORY */}
        {activeTab === 'memory' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Persistent Multi-Layer Memory Items
            </h4>
            {profile.memories.length > 0 ? (
              profile.memories.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-border/60 bg-card/40 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary font-mono">{m.key}</span>
                    <span className="badge badge-outline text-[10px] uppercase">{m.type}</span>
                  </div>
                  <p className="text-foreground/90">{m.content}</p>
                  <div className="text-[10px] text-muted-foreground">
                    Importance Factor: {m.importance}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No long-term memories cached yet.</p>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL */}
        {activeTab === 'audits' && (
          <div className="space-y-3 animate-fade-in">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Consequential Action Log (Audit Trail)
            </h4>
            {profile.recent_audits.length > 0 ? (
              profile.recent_audits.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-border/60 bg-card/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {a.action} {a.step ? `• ${a.step}` : ''}
                    </span>
                    <span className={`text-[10px] font-bold ${a.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {JSON.stringify(a.details)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No audit records logged.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
