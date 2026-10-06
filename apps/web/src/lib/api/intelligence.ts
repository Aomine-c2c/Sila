/**
 * NEIMAN Intelligence Exchange API Client
 */

import { api } from './client';

export interface ModelProvider {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  website_url?: string | null;
  is_local: boolean;
  is_active: boolean;
  is_healthy: boolean;
  consecutive_failures: number;
  created_at: string;
}

export interface Model {
  id: string;
  provider_id: string;
  model_identifier: string;
  display_name: string;
  description?: string | null;
  capabilities: string[];
  modalities: string[];
  context_capacity: number;
  max_output_tokens?: number;
  supports_tools?: boolean;
  tool_support?: boolean;
  supports_structured_output?: boolean;
  structured_output_support?: boolean;
  input_cost_per_million: number;
  output_cost_per_million: number;
  avg_latency_ms: number;
  availability_rate?: number;
  privacy_classification: string;
  is_active: boolean;
  created_at: string;
}

export type RoutingMode = 'AUTOMATIC' | 'MANUAL' | 'AGENT_PREFERENCE' | 'COMPANY_POLICY';

export interface ModelRoutingPolicy {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  routing_mode?: RoutingMode;
  preferred_provider?: string | null;
  fallback_provider?: string | null;
  strategy: 'BALANCED' | 'LOWEST_COST' | 'LOWEST_LATENCY' | 'HIGHEST_CAPABILITY' | 'STRICT_PRIVACY';
  max_cost_per_query_usd: number;
  max_acceptable_latency_ms: number;
  required_privacy_level?: string | null;
  required_capability?: string | null;
  fallback_chain: string[];
  capability_preferences: Record<string, string>;
  is_default: boolean;
  created_at: string;
}

export interface ModelRoutingPolicyUpdate {
  name?: string;
  description?: string;
  routing_mode?: RoutingMode;
  preferred_provider?: string | null;
  fallback_provider?: string | null;
  strategy?: 'BALANCED' | 'LOWEST_COST' | 'LOWEST_LATENCY' | 'HIGHEST_CAPABILITY' | 'STRICT_PRIVACY';
  max_cost_per_query_usd?: number;
  max_acceptable_latency_ms?: number;
  required_privacy_level?: string | null;
  required_capability?: string | null;
  fallback_chain?: string[];
  capability_preferences?: Record<string, string>;
  is_default?: boolean;
}

export interface RoutingDecisionLog {
  id: string;
  requested_capability: string;
  provider: string;
  model: string;
  cost_usd: number;
  latency_ms: number;
  routed_tier?: string;
  fallback: boolean;
  fallback_reason?: string | null;
  attempts_count?: number;
  routing_trace?: Array<{
    tier: string;
    provider: string;
    model: string;
    action: string;
    attempt?: number;
    error?: string;
    reason?: string;
  }>;
  circuit_breaker_status?: string;
  success: boolean;
  created_at: string;
}

export interface IntelligenceDashboardData {
  total_requests: number;
  total_tokens_consumed: number;
  total_spend_usd: number;
  avg_latency_ms: number;
  overall_success_rate: number;
  providers_count: number;
  models_count: number;
  healthy_providers_count: number;
  recent_routing_decisions: RoutingDecisionLog[];
  available_providers: ModelProvider[];
  available_models: Model[];
}

export interface GenerateRequest {
  prompt: string;
  system_prompt?: string;
  required_capabilities?: string[];
  context_tokens_needed?: number;
  preferred_provider?: string;
  preferred_model?: string;
  allow_fallback?: boolean;
  max_acceptable_cost_usd?: number;
  token_ceiling?: number;
  timeout_seconds?: number;
  required_privacy?: string;
  temperature?: number;
  max_tokens?: number;
  structured_output_schema?: Record<string, unknown>;
  simulation_flags?: Record<string, string>;
}

export interface GenerateResponse {
  text: string;
  model_used: string;
  provider_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
  routed_tier: string;
  routed_via_fallback: boolean;
  fallback_reason?: string | null;
  attempts_count: number;
  routing_trace: Array<{
    tier: string;
    provider: string;
    model: string;
    action: string;
    attempt?: number;
    error?: string;
    reason?: string;
  }>;
  structured_output_validated: boolean;
  circuit_breaker_status: string;
}

export interface ProviderProbeRequest {
  simulated_latency_ms?: number;
  simulate_error?: string | null;
}

export interface ProviderProbeResponse {
  provider_name: string;
  is_healthy: boolean;
  circuit_breaker_status: string;
  consecutive_failures: number;
  measured_latency_ms: number;
  probe_timestamp: string;
  detail: string;
}

export const intelligenceApi = {
  getDashboard: (companyId: string): Promise<IntelligenceDashboardData> =>
    api.get<IntelligenceDashboardData>(`/api/v1/companies/${companyId}/intelligence/dashboard`),

  getPolicy: (companyId: string): Promise<ModelRoutingPolicy> =>
    api.get<ModelRoutingPolicy>(`/api/v1/companies/${companyId}/intelligence/policy`),

  updatePolicy: (companyId: string, policy: ModelRoutingPolicyUpdate): Promise<ModelRoutingPolicy> =>
    api.put<ModelRoutingPolicy>(`/api/v1/companies/${companyId}/intelligence/policy`, policy),

  listProviders: (companyId: string): Promise<ModelProvider[]> =>
    api.get<ModelProvider[]>(`/api/v1/companies/${companyId}/intelligence/providers`),

  listModels: (companyId: string): Promise<Model[]> =>
    api.get<Model[]>(`/api/v1/companies/${companyId}/intelligence/models`),

  probeProvider: (
    companyId: string,
    providerName: string,
    body?: ProviderProbeRequest
  ): Promise<ProviderProbeResponse> =>
    api.post<ProviderProbeResponse>(
      `/api/v1/companies/${companyId}/intelligence/providers/${providerName}/probe`,
      body || {}
    ),

  generate: (companyId: string, body: GenerateRequest): Promise<GenerateResponse> =>
    api.post<GenerateResponse>(`/api/v1/companies/${companyId}/intelligence/generate`, body),

  resetCircuitBreakers: (companyId: string): Promise<{ status: string; message: string }> =>
    api.post<{ status: string; message: string }>(`/api/v1/companies/${companyId}/intelligence/circuit-breakers/reset`, {}),

  createProvider: (companyId: string, body: {
    name: string;
    display_name: string;
    description?: string;
    website_url?: string;
    is_local?: boolean;
  }): Promise<ModelProvider> =>
    api.post<ModelProvider>(`/api/v1/companies/${companyId}/intelligence/providers`, body),

  createModel: (companyId: string, body: {
    provider_id: string;
    model_identifier: string;
    display_name: string;
    description?: string;
    capabilities?: string[];
    modalities?: string[];
    tool_support?: boolean;
    structured_output_support?: boolean;
    context_capacity?: number;
    max_output_tokens?: number;
    input_cost_per_million?: number;
    output_cost_per_million?: number;
    avg_latency_ms?: number;
    availability_rate?: number;
    privacy_classification?: string;
  }): Promise<Model> =>
    api.post<Model>(`/api/v1/companies/${companyId}/intelligence/models`, body),
};

