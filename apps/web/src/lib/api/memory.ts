/**
 * NEIMAN Organizational Memory API Client
 * Manages 10 memory domains, contextual assembly, permissions, and decision records.
 */

import { api } from './client';

export type MemoryDomain =
  | 'COMPANY'
  | 'DEPARTMENT'
  | 'AGENT'
  | 'PROJECT'
  | 'CUSTOMER'
  | 'DECISION'
  | 'POLICY'
  | 'EXPERIMENT'
  | 'FAILURE'
  | 'KNOWLEDGE_BASE'
  | 'DOCUMENT'
  | 'LESSON';

export type MemoryScope = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'PRIVATE';
export type ProvenanceType = 'HUMAN_INPUT' | 'AGENT_OBSERVATION' | 'SYSTEM_EVENT' | 'DOCUMENT_INGESTION' | 'COUNCIL_RESOLUTION';
export type RetentionPolicy = 'PERMANENT' | 'ONE_YEAR' | 'NINETY_DAYS' | 'THIRTY_DAYS' | 'EPHEMERAL';

export interface MemoryItem {
  id: string;
  company_id: string;
  domain: MemoryDomain;
  scope: MemoryScope;
  title: string;
  content: string;
  summary?: string | null;
  department_id?: string | null;
  agent_id?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  provenance_type: ProvenanceType;
  source: string;
  owner_id?: string | null;
  confidence: number;
  relevance_score: number;
  access_count: number;
  last_accessed_at?: string | null;
  required_permissions: string[];
  retention_policy: RetentionPolicy;
  is_archived: boolean;
  tags: string[];
  extra_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MemoryItemCreate {
  domain: MemoryDomain;
  scope?: MemoryScope;
  title: string;
  content: string;
  summary?: string;
  department_id?: string;
  agent_id?: string;
  project_id?: string;
  task_id?: string;
  provenance_type?: ProvenanceType;
  source?: string;
  confidence?: number;
  relevance_score?: number;
  required_permissions?: string[];
  retention_policy?: RetentionPolicy;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface AssembledMemorySnippet {
  memory_id: string;
  domain: string;
  title: string;
  excerpt: string;
  relevance_score: number;
  confidence: number;
  source: string;
}

export interface ContextAssemblyRequest {
  task_objective: string;
  task_id?: string;
  agent_id?: string;
  department_id?: string;
  project_id?: string;
  target_domains?: MemoryDomain[];
  caller_permissions?: string[];
  caller_role?: string;
  max_context_tokens?: number;
  max_items?: number;
}

export interface ContextAssemblyResponse {
  task_objective: string;
  total_memories_evaluated: number;
  authorized_memories_selected: number;
  estimated_context_tokens: number;
  domains_consulted: string[];
  assembled_context_prompt: string;
  snippets: AssembledMemorySnippet[];
}

export interface OptionConsidered {
  id?: string;
  title: string;
  description: string;
  pros?: string[];
  cons?: string[];
  impact_score?: number;
}

export interface EvidenceItem {
  source: string;
  claim: string;
  verified?: boolean;
  url_or_ref?: string;
}

export interface DecisionParticipant {
  name: string;
  role: string;
  identity_type?: 'USER' | 'AGENT';
  stance?: 'SUPPORT' | 'OBJECT' | 'NEUTRAL';
}

export interface DecisionRecord {
  id: string;
  company_id: string;
  title: string;
  problem: string;
  options: OptionConsidered[];
  evidence: EvidenceItem[];
  participants: DecisionParticipant[];
  decision: string;
  rationale: string;
  expected_outcome: string;
  actual_outcome?: string | null;
  lessons_learned: string[];
  decided_by_user_id?: string | null;
  decided_by_agent_id?: string | null;
  memory_item_id?: string | null;
  decided_at: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionRecordCreate {
  title: string;
  problem: string;
  options?: OptionConsidered[];
  evidence?: EvidenceItem[];
  participants?: DecisionParticipant[];
  decision: string;
  rationale: string;
  expected_outcome: string;
  actual_outcome?: string;
  lessons_learned?: string[];
  decided_by_agent_id?: string;
}

export interface DecisionOutcomeUpdate {
  actual_outcome: string;
  lessons_learned: string[];
}

export const memoryApi = {
  listMemories: (
    companyId: string,
    params?: { domain?: string; scope?: string; limit?: number }
  ): Promise<MemoryItem[]> => {
    const q = new URLSearchParams();
    if (params?.domain) q.append('domain', params.domain);
    if (params?.scope) q.append('scope', params.scope);
    if (params?.limit) q.append('limit', params.limit.toString());
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return api.get<MemoryItem[]>(`/api/v1/companies/${companyId}/memory/items${queryStr}`);
  },

  createMemory: (companyId: string, item: MemoryItemCreate): Promise<MemoryItem> =>
    api.post<MemoryItem>(`/api/v1/companies/${companyId}/memory/items`, item),

  getMemory: (companyId: string, memoryId: string): Promise<MemoryItem> =>
    api.get<MemoryItem>(`/api/v1/companies/${companyId}/memory/items/${memoryId}`),

  search: (
    companyId: string,
    query: string,
    domain?: string,
    scope?: string
  ): Promise<MemoryItem[]> => {
    const q = new URLSearchParams({ q: query });
    if (domain) q.append('domain', domain);
    if (scope) q.append('scope', scope);
    return api.get<MemoryItem[]>(`/api/v1/companies/${companyId}/memory/search?${q.toString()}`);
  },

  assembleContext: (
    companyId: string,
    req: ContextAssemblyRequest
  ): Promise<ContextAssemblyResponse> =>
    api.post<ContextAssemblyResponse>(`/api/v1/companies/${companyId}/memory/assemble-context`, req),

  listDecisions: (companyId: string, limit: number = 50): Promise<DecisionRecord[]> =>
    api.get<DecisionRecord[]>(`/api/v1/companies/${companyId}/memory/decisions?limit=${limit}`),

  createDecision: (companyId: string, decision: DecisionRecordCreate): Promise<DecisionRecord> =>
    api.post<DecisionRecord>(`/api/v1/companies/${companyId}/memory/decisions`, decision),

  recordOutcome: (
    companyId: string,
    decisionId: string,
    outcome: DecisionOutcomeUpdate
  ): Promise<DecisionRecord> =>
    api.post<DecisionRecord>(`/api/v1/companies/${companyId}/memory/decisions/${decisionId}/outcome`, outcome),

  getKnowledgeGraph: (
    companyId: string,
    limit: number = 100
  ): Promise<{
    entities: Array<{
      id: string;
      name: string;
      entity_type: string;
      description?: string;
      properties: Record<string, unknown>;
    }>;
    relations: Array<{
      id: string;
      source_id: string;
      target_id: string;
      relation_type: string;
      weight: number;
      provenance?: string;
    }>;
    total_entities: number;
    total_relations: number;
  }> => api.get(`/api/v1/companies/${companyId}/memory/graph?limit=${limit}`),

  extractKnowledgeFacts: (
    companyId: string,
    payload: { text: string; provenance?: string }
  ): Promise<{ status: string; facts_extracted: number }> =>
    api.post(`/api/v1/companies/${companyId}/memory/graph/extract`, payload),
};

