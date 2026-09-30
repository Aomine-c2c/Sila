'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Cpu,
  Layers,
  Shield,
  Activity,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Send,
  Sliders,
  Sparkles,
  Server,
  Cloud,
  Check,
  RotateCw,
} from 'lucide-react';
import {
  intelligenceApi,
  Model,
  ModelProvider,
  GenerateRequest,
  ModelRoutingPolicyUpdate,
} from '@/lib/api/intelligence';
import { useAuthStore } from '@/store/auth';

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  BALANCED: 'Optimizes across cost, latency, and capability matching based on company priorities.',
  LOWEST_COST: 'Greedily selects the cheapest model capable of completing the task tokens.',
  LOWEST_LATENCY: 'Routes to the fastest available provider with minimum millisecond round-trips.',
  HIGHEST_CAPABILITY: 'Prioritizes maximum parameter count and reasoning depth regardless of cost.',
  STRICT_PRIVACY: 'Strictly routes to air-gapped on-premise zero-retention local models.',
};

export default function IntelligenceExchangePage() {
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const companyId = activeCompany?.id || '';
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState<'matrix' | 'simulator' | 'policy' | 'decisions'>('matrix');

  // Simulator State
  const [prompt, setPrompt] = useState('Draft an incident mitigation plan for a cascading queue blockage');
  const [selectedCapability, setSelectedCapability] = useState('reasoning');
  const [preferredProvider, setPreferredProvider] = useState<string>('');
  const [preferredModel, setPreferredModel] = useState<string>('');
  const [requiredPrivacy, setRequiredPrivacy] = useState<string>('');
  const [allowFallback, setAllowFallback] = useState(true);

  // Policy Form State
  const [policyStrategy, setPolicyStrategy] = useState<
    'BALANCED' | 'LOWEST_COST' | 'LOWEST_LATENCY' | 'HIGHEST_CAPABILITY' | 'STRICT_PRIVACY'
  >('BALANCED');
  const [maxCostCeiling, setMaxCostCeiling] = useState('0.50');
  const [policySaved, setPolicySaved] = useState(false);

  // Query: Dashboard Data
  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['intelligence-dashboard', companyId],
    queryFn: () => intelligenceApi.getDashboard(companyId),
    enabled: !!companyId,
    refetchInterval: 10000,
  });

  // Query: Active Policy
  const { data: policy } = useQuery({
    queryKey: ['intelligence-policy', companyId],
    queryFn: () => intelligenceApi.getPolicy(companyId),
    enabled: !!companyId,
  });

  // Mutation: Test Generation Simulator
  const testGenerateMutation = useMutation({
    mutationFn: (req: GenerateRequest) => intelligenceApi.generate(companyId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-dashboard', companyId] });
    },
  });

  // Mutation: Update Routing Policy
  const updatePolicyMutation = useMutation({
    mutationFn: (update: ModelRoutingPolicyUpdate) => intelligenceApi.updatePolicy(companyId, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-policy', companyId] });
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3000);
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    testGenerateMutation.mutate({
      prompt,
      required_capabilities: [selectedCapability],
      preferred_provider: preferredProvider || undefined,
      preferred_model: preferredModel || undefined,
      required_privacy: requiredPrivacy || undefined,
      allow_fallback: allowFallback,
    });
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updatePolicyMutation.mutate({
      strategy: policyStrategy,
      max_cost_per_query_usd: parseFloat(maxCostCeiling) || 0.5,
    });
  };

  const providers = dashboard?.available_providers || [];
  const models = dashboard?.available_models || [];
  const decisions = dashboard?.recent_routing_decisions || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header / Philosophy Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              NEXORA Intelligence Exchange
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Provider Abstraction & Dynamic Routing
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              <span className="font-semibold text-foreground">Rule:</span> Agents are organizational identities. AI models are intelligence providers. Agents request capabilities; the Intelligence Router dynamically balances cost, latency, privacy, and automatic fallbacks.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Primary KPI Telemetry Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Requests</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? '...' : dashboard?.total_requests ?? 0}
          </div>
          <div className="text-[10px] text-muted-foreground">Total routed queries</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Spend</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ${isLoading ? '0.00' : (dashboard?.total_spend_usd ?? 0).toFixed(4)}
          </div>
          <div className="text-[10px] text-muted-foreground">Cumulative AI inference</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Latency</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? '0' : Math.round(dashboard?.avg_latency_ms ?? 0)} ms
          </div>
          <div className="text-[10px] text-muted-foreground">Round-trip dispatch</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {isLoading ? '100' : Math.round((dashboard?.overall_success_rate ?? 1) * 100)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Routing reliability</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Providers</span>
            <Cloud className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {dashboard?.healthy_providers_count ?? 4}/{dashboard?.providers_count ?? 4}
          </div>
          <div className="text-[10px] text-muted-foreground">Active & Healthy</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Models</span>
            <Cpu className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {dashboard?.models_count ?? 4}
          </div>
          <div className="text-[10px] text-muted-foreground">Registered in exchange</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Cpu className="h-4 w-4" />
          Provider & Model Catalog ({models.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'simulator'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Capability Routing Simulator
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'policy'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Routing Policy & Failovers
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'decisions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Routing Decision Ledger ({decisions.length})
        </button>
      </div>

      {/* TAB 1: MODEL MATRIX & PROVIDERS */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    {p.is_local ? <Server className="h-4 w-4 text-emerald-400" /> : <Cloud className="h-4 w-4 text-blue-400" />}
                    {p.display_name}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      p.is_healthy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {p.is_healthy ? 'HEALTHY' : 'DEGRADED'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="text-[11px] text-muted-foreground flex justify-between border-t border-border pt-2">
                  <span>Type: {p.is_local ? 'Self-Hosted / Local' : 'Cloud API'}</span>
                  <span>Failures: {p.consecutive_failures}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Registered Intelligence Models</h2>
              <span className="text-xs text-muted-foreground">Universal Adapter Compatible</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3">Model</th>
                    <th className="p-3">Capabilities</th>
                    <th className="p-3">Context Window</th>
                    <th className="p-3">Input / 1M</th>
                    <th className="p-3">Output / 1M</th>
                    <th className="p-3">Avg Latency</th>
                    <th className="p-3">Privacy Tier</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {models.map((m: Model) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-semibold text-foreground">
                        <div>{m.display_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{m.model_identifier}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {m.capabilities.map((cap) => (
                            <span key={cap} className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-foreground font-mono">
                        {(m.context_capacity / 1000).toLocaleString()}k tokens
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">${m.input_cost_per_million.toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground font-mono">${m.output_cost_per_million.toFixed(2)}</td>
                      <td className="p-3 text-foreground font-mono">{m.avg_latency_ms} ms</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            m.privacy_classification === 'ON_PREMISE_ZERO_RETENTION'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {m.privacy_classification}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTING SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulator Form */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">Test Capability Routing</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Dispatch vendor-neutral requests through the intelligence exchange to observe dynamic model selection.
              </p>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Agent Prompt</label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="Describe task requirement..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Required Capability</label>
                  <select
                    value={selectedCapability}
                    onChange={(e) => setSelectedCapability(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="reasoning">reasoning (General)</option>
                    <option value="architectural_reasoning">architectural_reasoning (Deep)</option>
                    <option value="large_context">large_context (&gt;1M Tokens)</option>
                    <option value="code_generation">code_generation (Engineering)</option>
                    <option value="privacy">privacy (Air-gapped)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Privacy Requirement</label>
                  <select
                    value={requiredPrivacy}
                    onChange={(e) => setRequiredPrivacy(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Standard Cloud Tolerant</option>
                    <option value="ON_PREMISE_ZERO_RETENTION">ON_PREMISE_ZERO_RETENTION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Provider Override <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <select
                    value={preferredProvider}
                    onChange={(e) => setPreferredProvider(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Let Router Decide</option>
                    <option value="google_gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="local">Local / Air-Gapped</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Model Identifier Override <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <select
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Let Router Decide</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="local-deepseek-r1">local-deepseek-r1</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowFallback"
                  checked={allowFallback}
                  onChange={(e) => setAllowFallback(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="allowFallback" className="text-xs text-muted-foreground cursor-pointer">
                  Allow automatic failover through company fallback chain if provider errors
                </label>
              </div>

              <button
                type="submit"
                disabled={testGenerateMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {testGenerateMutation.isPending ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Routing Intelligence...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Dispatch to Intelligence Router
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Simulator Execution Output */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Router Resolution & Execution</h2>
                {testGenerateMutation.data && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Resolved Successfully
                  </span>
                )}
              </div>

              {testGenerateMutation.isPending && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <RotateCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    Evaluating capabilities, constraints, latency, and available health pools...
                  </p>
                </div>
              )}

              {testGenerateMutation.isError && (
                <div className="mt-4 p-4 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Routing Resolution Failed
                  </div>
                  <div>{(testGenerateMutation.error as Error).message}</div>
                </div>
              )}

              {testGenerateMutation.data && (
                <div className="mt-4 space-y-4">
                  {/* Routed Telemetry Chips */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Provider</div>
                      <div className="text-xs font-semibold text-foreground uppercase">
                        {testGenerateMutation.data.provider_used}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Model Routed</div>
                      <div className="text-xs font-semibold text-primary font-mono">
                        {testGenerateMutation.data.model_used}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Latency</div>
                      <div className="text-xs font-semibold text-amber-400 font-mono">
                        {testGenerateMutation.data.latency_ms} ms
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-background border border-border">
                      <div className="text-[10px] text-muted-foreground">Inference Cost</div>
                      <div className="text-xs font-semibold text-emerald-400 font-mono">
                        ${testGenerateMutation.data.estimated_cost_usd.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {testGenerateMutation.data.routed_via_fallback && (
                    <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                      <strong>Failover Provenance:</strong> {testGenerateMutation.data.fallback_reason}
                    </div>
                  )}

                  {/* Generated Output */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Model Synthesis</label>
                    <div className="rounded-lg border border-border bg-background p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {testGenerateMutation.data.text}
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Prompt Tokens: {testGenerateMutation.data.prompt_tokens}</span>
                    <span>Completion: {testGenerateMutation.data.completion_tokens}</span>
                    <span>Total Tokens: {testGenerateMutation.data.total_tokens}</span>
                  </div>
                </div>
              )}

              {!testGenerateMutation.data && !testGenerateMutation.isPending && !testGenerateMutation.isError && (
                <div className="py-20 text-center space-y-2 text-muted-foreground">
                  <Cpu className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="text-xs">No active simulation run yet. Click dispatch to test routing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POLICY & FALLBACKS */}
      {activeTab === 'policy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Global Routing Policy</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Configure organizational arbitration rules for capability matching, budget limits, and failover chains.
              </p>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Optimization Strategy</label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    ['BALANCED', 'LOWEST_COST', 'LOWEST_LATENCY', 'HIGHEST_CAPABILITY', 'STRICT_PRIVACY'] as const
                  ).map((strat) => (
                    <label
                      key={strat}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        policyStrategy === strat
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="strategy"
                        value={strat}
                        checked={policyStrategy === strat}
                        onChange={() => setPolicyStrategy(strat)}
                        className="mt-0.5 text-primary"
                      />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{strat.replace('_', ' ')}</div>
                        <div className="text-[11px] text-muted-foreground">{STRATEGY_DESCRIPTIONS[strat]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Max Cost Ceiling per Query ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={maxCostCeiling}
                  onChange={(e) => setMaxCostCeiling(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={updatePolicyMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save Policy Configuration
                </button>
                {policySaved && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Updated successfully
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Active Fallback Chain Visualizer */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Failover & Emergency Chain</h2>
              <p className="text-xs text-muted-foreground mt-1">
                When upstream providers experience rate-limiting, latency spikes, or 5xx outages, requests cascade sequentially.
              </p>
            </div>

            <div className="space-y-3">
              {(policy?.fallback_chain || ['claude-3-5-sonnet', 'gemini-1.5-pro', 'local-deepseek-r1']).map(
                (ident, idx) => (
                  <div
                    key={ident}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-border bg-background"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-foreground font-mono">{ident}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {idx === 0
                          ? 'Primary Provider Target'
                          : idx === 1
                          ? 'Secondary Fallback Provider'
                          : 'Emergency Air-Gapped Local Cluster'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                      Auto-Cascade
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" /> Circuit Breaker Protection
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                If any provider logs 3 consecutive failures or 429 Rate Limits, the exchange marks it degraded and bypasses it automatically until health probes clear.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTING DECISIONS LEDGER */}
      {activeTab === 'decisions' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent Routing Decisions & Audits</h2>
            <span className="text-xs text-muted-foreground">Chronological Intelligence Ledger</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Capability Requested</th>
                  <th className="p-3">Provider Selected</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Cost ($)</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Fallback</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decisions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No routing requests recorded yet. Run a simulation to log telemetry.
                    </td>
                  </tr>
                ) : (
                  decisions.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-muted-foreground font-mono">
                        {new Date(d.created_at).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                          {d.requested_capability}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground uppercase">{d.provider}</td>
                      <td className="p-3 font-mono text-foreground">{d.model}</td>
                      <td className="p-3 font-mono text-emerald-400">${d.cost_usd.toFixed(6)}</td>
                      <td className="p-3 font-mono text-foreground">{d.latency_ms} ms</td>
                      <td className="p-3">
                        {d.fallback ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300">
                            Cascaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">Direct</span>
                        )}
                      </td>
                      <td className="p-3">
                        {d.success ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <AlertTriangle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
