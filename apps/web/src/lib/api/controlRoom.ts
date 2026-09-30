/**
 * NEXORA Control Room Unified API Client
 * Interfaces for fetching the full organizational state, 15 core domains, and real-time operational answers.
 */

import { api } from './client';
import type { Agent } from './agents';
import type { Department, OrgRole } from './organizations';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { getControlRoomPreviewState } from './controlRoomPreview';

export interface Project {
  id: string;
  company_id: string;
  owner_id: string;
  name: string;
  objective: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  milestones: Array<{ title: string; description?: string | null; due_date?: string | null; completed: boolean }>;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  assigned_agent_id?: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  company_id: string;
  agent_id?: string;
  task_id?: string;
  action_type: string;
  target_resource: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id: string;
  actor_id?: string;
  actor_type?: string;
  authority_level?: string;
  action: string;
  target?: string;
  reason?: string;
  result?: string;
  autonomy_level?: number;
  created_at: string;
}

export interface ResourceSummary {
  compute_used_pct: number | null;
  memory_used_gb: number | null;
  memory_limit_gb: number | null;
  token_usage_total: number | null;
  intelligence_cost_usd: number | null;
  budget_allocated_usd: number | null;
  budget_spent_usd: number | null;
}

export interface DecisionRecord {
  id: string;
  company_id: string;
  problem: string;
  decision?: string;
  status: 'PROPOSED' | 'DELIBERATING' | 'DECIDED' | 'EXECUTED';
  rationale?: string;
  expected_outcome?: string;
  created_at: string;
}

export interface Policy {
  id: string;
  company_id: string;
  name: string;
  scope: string;
  enforcement_level: string;
  is_active: boolean;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  domain: string;
  title: string;
  content: string;
  scope: string;
  created_at: string;
}

export interface ModelProviderInfo {
  id: string;
  name: string;
  provider: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  active_requests: number | null;
  avg_latency_ms: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
}

export interface ControlRoomState {
  company_id: string;
  agents: Agent[];
  departments: Department[];
  roles: OrgRole[];
  projects: Project[];
  tasks: Task[];
  approvals: ApprovalRequest[];
  audits: AuditLog[];
  resources: ResourceSummary;
  decisions: DecisionRecord[];
  policies: Policy[];
  memories: MemoryItem[];
  providers: ModelProviderInfo[];
  unavailableSections: string[];
}

export const controlRoomApi = {
  // Aggregate call to load full control room state
  getOperationalState: async (companyId: string): Promise<ControlRoomState> => {
    // Fixtures are only available in the explicit local development preview. This path
    // returns before any network request and cannot be enabled in production.
    if (isDevelopmentAuthBypassEnabled()) return getControlRoomPreviewState();

    // Fetch each domain independently so a partial API outage does not hide usable data.
    const [
      agentsRes,
      deptsRes,
      rolesRes,
      projectsRes,
      approvalsRes,
      auditsRes,
      decisionsRes,
      policiesRes,
      resourceRes,
      intelligenceRes,
      memoryRes,
    ] = await Promise.allSettled([
      api.get<Agent[]>(`/api/v1/companies/${companyId}/agents`),
      api.get<Department[]>(`/api/v1/companies/${companyId}/departments`),
      api.get<OrgRole[]>(`/api/v1/companies/${companyId}/roles`),
      api.get<Project[]>(`/api/v1/companies/${companyId}/projects`),
      api.get<ApprovalRequest[]>(`/api/v1/companies/${companyId}/governance/approvals?status=PENDING`),
      api.get<AuditLog[]>(`/api/v1/companies/${companyId}/governance/audits?limit=25`),
      api.get<DecisionRecord[]>(`/api/v1/companies/${companyId}/decisions`),
      api.get<Policy[]>(`/api/v1/companies/${companyId}/policies`),
      api.get<any>(`/api/v1/companies/${companyId}/resources/control-center`),
      api.get<any>(`/api/v1/companies/${companyId}/intelligence/dashboard`),
      api.get<MemoryItem[]>(`/api/v1/companies/${companyId}/memory/items?limit=50`),
    ]);

    const agents = agentsRes.status === 'fulfilled' ? agentsRes.value : [];
    const departments = deptsRes.status === 'fulfilled' ? deptsRes.value : [];
    const roles = rolesRes.status === 'fulfilled' ? rolesRes.value : [];
    const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
    const approvals = approvalsRes.status === 'fulfilled' ? approvalsRes.value : [];
    const audits = auditsRes.status === 'fulfilled' ? auditsRes.value : [];
    const decisions = decisionsRes.status === 'fulfilled' ? decisionsRes.value : [];
    const policies = policiesRes.status === 'fulfilled' ? policiesRes.value : [];

    const resourceData = resourceRes.status === 'fulfilled' ? resourceRes.value : null;
    const summary = resourceData?.summary;
    const resources: ResourceSummary = {
      compute_used_pct: summary?.compute_utilization ?? null,
      memory_used_gb: summary?.memory_used_gb ?? null,
      memory_limit_gb: summary?.memory_limit_gb ?? null,
      token_usage_total: summary?.tokens_consumed ?? (intelligenceRes.status === 'fulfilled' ? intelligenceRes.value.total_tokens_consumed ?? null : null),
      intelligence_cost_usd: summary?.total_cost_usd ?? (intelligenceRes.status === 'fulfilled' ? intelligenceRes.value.total_spend_usd ?? null : null),
      budget_allocated_usd: summary?.budget_allocated ?? null,
      budget_spent_usd: summary?.budget_spent ?? null,
    };

    const intelData = intelligenceRes.status === 'fulfilled' ? intelligenceRes.value : null;
    const providers: ModelProviderInfo[] = (intelData?.available_providers ?? []).map((provider: any) => ({
      id: provider.id,
      name: provider.display_name,
      provider: provider.is_local ? 'local' : provider.name,
      status: !provider.is_active ? 'OFFLINE' : provider.is_healthy ? 'ONLINE' : 'DEGRADED',
      active_requests: null,
      avg_latency_ms: null,
      total_tokens: null,
      cost_usd: null,
    }));
    const memories = memoryRes.status === 'fulfilled' ? memoryRes.value : [];
    const taskResults = await Promise.allSettled(projects.map((project) =>
      api.get<Task[]>(`/api/v1/companies/${companyId}/projects/${project.id}/tasks`),
    ));
    const tasks = taskResults.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
    const unavailableSections = [
      ...(agentsRes.status === 'rejected' ? ['agents'] : []),
      ...(deptsRes.status === 'rejected' ? ['departments'] : []),
      ...(rolesRes.status === 'rejected' ? ['roles'] : []),
      ...(projectsRes.status === 'rejected' ? ['projects'] : []),
      ...(approvalsRes.status === 'rejected' ? ['approvals'] : []),
      ...(auditsRes.status === 'rejected' ? ['audit log'] : []),
      ...(decisionsRes.status === 'rejected' ? ['decisions'] : []),
      ...(policiesRes.status === 'rejected' ? ['policies'] : []),
      ...(resourceRes.status === 'rejected' ? ['resource telemetry'] : []),
      ...(intelligenceRes.status === 'rejected' ? ['provider telemetry'] : []),
      ...(memoryRes.status === 'rejected' ? ['organization memory'] : []),
      ...(taskResults.some((result) => result.status === 'rejected') ? ['some project tasks'] : []),
    ];

    return {
      company_id: companyId,
      agents,
      departments,
      roles,
      projects,
      tasks,
      approvals,
      audits,
      resources,
      decisions,
      policies,
      memories,
      providers,
      unavailableSections,
    };
  },

  decideApproval: async (companyId: string, approvalId: string, decision: 'APPROVED' | 'REJECTED', reason: string) => {
    return api.post(`/api/v1/companies/${companyId}/governance/approvals/${approvalId}/decision`, {
      status: decision,
      decision_notes: reason,
    });
  },
};
