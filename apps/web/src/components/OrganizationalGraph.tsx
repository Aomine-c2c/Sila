'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  Bot,
  FolderGit2,
  CheckSquare,
  Scale,
  FileSearch,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import type { Agent } from '@/lib/api/agents';
import type { Department } from '@/lib/api/organizations';
import type { Project, Task, DecisionRecord } from '@/lib/api/controlRoom';

export interface GraphNode {
  id: string;
  type: 'company' | 'department' | 'agent' | 'project' | 'task' | 'decision' | 'evidence';
  title: string;
  subtitle?: string;
  status?: string;
  data: Record<string, unknown>;
  parentId?: string;
}

interface OrganizationalGraphProps {
  companyName: string;
  departments: Department[];
  agents: Agent[];
  projects: Project[];
  tasks: Task[];
  decisions: DecisionRecord[];
}

export function OrganizationalGraph({
  companyName,
  departments,
  agents,
  projects,
  tasks,
  decisions,
}: OrganizationalGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the hierarchical node graph
  const { nodes, edges } = useMemo(() => {
    const nList: GraphNode[] = [];
    const eList: { from: string; to: string }[] = [];

    // Root Company Node
    const rootId = 'root-company';
    nList.push({
      id: rootId,
      type: 'company',
      title: companyName || 'NEXORA Organization',
      subtitle: 'Root Autonomous Entity',
      status: 'ACTIVE',
      data: { name: companyName },
    });

    // Departments
    const activeDepts = departments.length > 0 ? departments : [
      { id: 'dept-eng', name: 'Engineering & Architecture', purpose: 'Core platform & autonomous agents', company_id: '1', status: 'ACTIVE', created_at: '', updated_at: '' },
      { id: 'dept-ops', name: 'Operations & Governance', purpose: 'Compliance & audit telemetry', company_id: '1', status: 'ACTIVE', created_at: '', updated_at: '' },
      { id: 'dept-growth', name: 'Growth & Intelligence', purpose: 'Multi-model optimization', company_id: '1', status: 'ACTIVE', created_at: '', updated_at: '' },
    ];

    activeDepts.forEach((dept) => {
      nList.push({
        id: `dept-${dept.id}`,
        type: 'department',
        title: dept.name,
        subtitle: dept.purpose ?? 'Department',
        status: dept.status,
        parentId: rootId,
        data: dept as unknown as Record<string, unknown>,
      });
      eList.push({ from: rootId, to: `dept-${dept.id}` });
    });

    // Agents
    const activeAgents = agents.length > 0 ? agents : [
      {
        id: 'ag-cto',
        name: 'Autonomous CTO Agent',
        status: 'AVAILABLE',
        autonomy: 'AUTONOMOUS',
        capabilities: ['Architecture', 'Synthesis', 'Audit'],
        system_instructions: 'Supervises system health and technical governance.',
        company_id: '1',
        identity: {},
        responsibilities: ['Architecture oversight', 'Task dispatch'],
        goals: ['Zero drift', 'Continuous reliability'],
        permissions: {},
        tools: [],
        intelligence_config: { provider: 'Anthropic Claude 3.5' },
        resource_limits: {},
        resource_usage: { total_cost_usd: 1.45 },
        performance_metadata: { tasks_completed: 42 },
        created_at: '',
        updated_at: '',
      },
      {
        id: 'ag-sec',
        name: 'Security Sentinel Agent',
        status: 'WORKING',
        autonomy: 'SEMI_AUTONOMOUS',
        capabilities: ['Vulnerability Scan', 'Policy Enforcement'],
        system_instructions: 'Enforces least privilege and constitutional boundaries.',
        company_id: '1',
        identity: {},
        responsibilities: ['Audit tracking', 'Approval gating'],
        goals: ['Zero policy violations'],
        permissions: {},
        tools: [],
        intelligence_config: { provider: 'Google Gemini 1.5 Pro' },
        resource_limits: {},
        resource_usage: { total_cost_usd: 0.88 },
        performance_metadata: { tasks_completed: 19 },
        created_at: '',
        updated_at: '',
      },
      {
        id: 'ag-intel',
        name: 'Intelligence Routing Broker',
        status: 'AVAILABLE',
        autonomy: 'FULLY_AUTONOMOUS',
        capabilities: ['Model Routing', 'Cost Optimization'],
        system_instructions: 'Optimizes dynamic model routing across Claude, Gemini, OpenAI.',
        company_id: '1',
        identity: {},
        responsibilities: ['Routing dispatch', 'Fallback handling'],
        goals: ['Min latency', 'Min token cost'],
        permissions: {},
        tools: [],
        intelligence_config: { provider: 'OpenAI GPT-4o' },
        resource_limits: {},
        resource_usage: { total_cost_usd: 0.65 },
        performance_metadata: { tasks_completed: 110 },
        created_at: '',
        updated_at: '',
      },
    ];

    activeAgents.forEach((ag, idx) => {
      const deptTarget = activeDepts[idx % activeDepts.length];
      const deptNodeId = `dept-${deptTarget.id}`;
      nList.push({
        id: `agent-${ag.id}`,
        type: 'agent',
        title: ag.name,
        subtitle: (ag.intelligence_config as any)?.provider || 'AI Employee',
        status: ag.status,
        parentId: deptNodeId,
        data: ag as unknown as Record<string, unknown>,
      });
      eList.push({ from: deptNodeId, to: `agent-${ag.id}` });
    });

    // Projects
    const activeProjects = projects.length > 0 ? projects : [
      { id: 'proj-1', title: 'NEXORA Operating System Upgrade', progress_pct: 78, status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, company_id: '1', owner_id: '1', created_at: '', updated_at: '' },
      { id: 'proj-2', title: 'Multi-Provider Resilience Mesh', progress_pct: 92, status: 'IN_PROGRESS' as const, priority: 'CRITICAL' as const, company_id: '1', owner_id: '1', created_at: '', updated_at: '' },
    ];

    activeProjects.forEach((proj, idx) => {
      const agentTarget = activeAgents[idx % activeAgents.length];
      const agentNodeId = `agent-${agentTarget.id}`;
      nList.push({
        id: `proj-${proj.id}`,
        type: 'project',
        title: proj.title,
        subtitle: `${proj.progress_pct}% Completed`,
        status: proj.status,
        parentId: agentNodeId,
        data: proj as unknown as Record<string, unknown>,
      });
      eList.push({ from: agentNodeId, to: `proj-${proj.id}` });
    });

    // Tasks
    const activeTasks = tasks.length > 0 ? tasks : [
      { id: 'tsk-1', title: 'Compile Consequential Audit Log', status: 'RUNNING' as const, priority: 'HIGH' as const, project_id: 'proj-1', created_at: '', updated_at: '' },
      { id: 'tsk-2', title: 'Validate Provider Fallback Chain', status: 'WAITING_APPROVAL' as const, priority: 'CRITICAL' as const, project_id: 'proj-2', created_at: '', updated_at: '' },
    ];

    activeTasks.forEach((tsk, idx) => {
      const projTarget = activeProjects[idx % activeProjects.length];
      const projNodeId = `proj-${projTarget.id}`;
      nList.push({
        id: `task-${tsk.id}`,
        type: 'task',
        title: tsk.title,
        subtitle: `Priority: ${tsk.priority}`,
        status: tsk.status,
        parentId: projNodeId,
        data: tsk as unknown as Record<string, unknown>,
      });
      eList.push({ from: projNodeId, to: `task-${tsk.id}` });
    });

    // Decisions
    const activeDecisions = decisions.length > 0 ? decisions : [
      { id: 'dec-1', problem: 'Fallback to Gemini 1.5 Flash on Sonnet 3.5 429', decision: 'Auto-reroute latency-sensitive tasks', status: 'EXECUTED' as const, rationale: 'Avoid user blocking when primary vendor experiences rate spikes.', company_id: '1', created_at: '' },
      { id: 'dec-2', problem: 'Require Human Signoff for Financial API Tool Execution', decision: 'Enforce Governance Gate 3', status: 'DECIDED' as const, rationale: 'Safeguard budgetary thresholds above $50.', company_id: '1', created_at: '' },
    ];

    activeDecisions.forEach((dec, idx) => {
      const taskTarget = activeTasks[idx % activeTasks.length];
      const taskNodeId = `task-${taskTarget.id}`;
      nList.push({
        id: `dec-${dec.id}`,
        type: 'decision',
        title: dec.problem,
        subtitle: dec.decision ?? 'Deliberation Record',
        status: dec.status,
        parentId: taskNodeId,
        data: dec as unknown as Record<string, unknown>,
      });
      eList.push({ from: taskNodeId, to: `dec-${dec.id}` });

      // Evidence node
      const evidenceNodeId = `ev-${dec.id}`;
      nList.push({
        id: evidenceNodeId,
        type: 'evidence',
        title: `Evidence & Provenance [${dec.id}]`,
        subtitle: dec.rationale ?? 'Verified Audit Proof',
        status: 'VERIFIED',
        parentId: `dec-${dec.id}`,
        data: { rationale: dec.rationale, status: 'Audited' },
      });
      eList.push({ from: `dec-${dec.id}`, to: evidenceNodeId });
    });

    return { nodes: nList, edges: eList };
  }, [companyName, departments, agents, projects, tasks, decisions]);

  const getNodeIcon = (type: GraphNode['type']) => {
    switch (type) {
      case 'company': return Building2;
      case 'department': return Users;
      case 'agent': return Bot;
      case 'project': return FolderGit2;
      case 'task': return CheckSquare;
      case 'decision': return Scale;
      case 'evidence': return FileSearch;
    }
  };

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'company': return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20';
      case 'department': return 'text-purple-400 border-purple-500/40 bg-purple-950/20';
      case 'agent': return 'text-blue-400 border-blue-500/40 bg-blue-950/20';
      case 'project': return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
      case 'task': return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
      case 'decision': return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
      case 'evidence': return 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20';
    }
  };

  // Group nodes by column hierarchy for the SVG layout
  const columns = useMemo(() => {
    const colOrder: GraphNode['type'][] = ['company', 'department', 'agent', 'project', 'task', 'decision', 'evidence'];
    return colOrder.map((type) => ({
      type,
      label: type.toUpperCase(),
      items: nodes.filter((n) => n.type === type),
    }));
  }, [nodes]);

  return (
    <div className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden flex flex-col h-[700px]">
      {/* Top Graph Controls Bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-wide">
              Autonomous Organizational Graph
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct Drilldown: Company → Dept → Agent → Project → Task → Decision → Evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="btn btn-ghost h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto p-8 relative scrollbar-hide select-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.1) 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="flex gap-16 min-w-max items-start transition-transform duration-150"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {columns.map((col, cIdx) => (
            <div key={col.type} className="flex flex-col gap-4 w-64 shrink-0">
              {/* Column Label */}
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-[10px] rounded-full bg-secondary/80 px-2 py-0.5 font-mono text-muted-foreground">
                  {col.items.length}
                </span>
              </div>

              {/* Column Nodes */}
              <div className="flex flex-col gap-3">
                {col.items.map((node) => {
                  const Icon = getNodeIcon(node.type);
                  const colorClass = getNodeColor(node.type);
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`
                        relative group rounded-xl border p-3.5 cursor-pointer transition-all duration-200
                        ${colorClass}
                        ${isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:border-primary/50 hover:shadow-md'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <h4 className="text-xs font-semibold truncate leading-tight">
                            {node.title}
                          </h4>
                        </div>
                        {node.status && (
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 border border-current/20">
                            {node.status}
                          </span>
                        )}
                      </div>

                      {node.subtitle && (
                        <p className="mt-1.5 text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                          {node.subtitle}
                        </p>
                      )}

                      {/* Direction indicator */}
                      {cIdx < columns.length - 1 && (
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-secondary/90 border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors z-10 shadow">
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-out Inspector Drawer for Selected Node */}
      {selectedNode && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 border-l border-border bg-card/95 backdrop-blur-2xl p-6 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {selectedNode.type}
              </span>
              <span className="text-xs font-mono text-muted-foreground">Detail View</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="btn btn-ghost h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">{selectedNode.title}</h3>
              {selectedNode.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{selectedNode.subtitle}</p>
              )}
            </div>

            {selectedNode.status && (
              <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                <span className="text-xs text-muted-foreground">Lifecycle State</span>
                <span className="text-xs font-semibold text-primary">{selectedNode.status}</span>
              </div>
            )}

            {/* Structured attributes inspection */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Organizational Attributes
              </h4>
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-2 text-xs">
                {Object.entries(selectedNode.data).slice(0, 8).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-start gap-2">
                    <span className="font-mono text-muted-foreground/70 shrink-0">{key}:</span>
                    <span className="font-medium text-foreground text-right truncate">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="btn btn-outline w-full text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
