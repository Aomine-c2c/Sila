'use client';

import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  RotateCw,
  Zap,
  Terminal,
  Plus,
  Radio,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { ModelProvider, Model, ProviderProbeRequest, ProviderProbeResponse } from '@/lib/api/intelligence';

interface ProviderDirectoryProps {
  providers: ModelProvider[];
  models: Model[];
  onResetBreakers?: () => void;
  isResetting?: boolean;
  onProbeProvider?: (providerName: string, req?: ProviderProbeRequest) => Promise<ProviderProbeResponse | void>;
  onAddProvider?: (data: {
    name: string;
    display_name: string;
    description?: string;
    website_url?: string;
    is_local?: boolean;
  }) => Promise<void>;
  isAddingProvider?: boolean;
}

export function ProviderDirectory({
  providers,
  models,
  onResetBreakers,
  isResetting,
  onProbeProvider,
  onAddProvider,
  isAddingProvider,
}: ProviderDirectoryProps) {
  const [probingProvider, setProbingProvider] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, ProviderProbeResponse>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    display_name: '',
    description: '',
    website_url: '',
    is_local: false,
  });

  const PRESETS = [
    {
      name: 'kilocode',
      display_name: 'Kilo Code Gateway',
      description: 'Universal multi-model AI coding gateway connecting frontier models with native tool use',
      website_url: 'https://api.kilo.ai/api/gateway',
      is_local: false,
    },
    {
      name: 'ollama',
      display_name: 'Ollama Local Host',
      description: 'Local on-device inference runtime for open-weights models (Llama 3.3, Qwen 2.5, DeepSeek)',
      website_url: 'http://localhost:11434',
      is_local: true,
    },
    {
      name: 'deepseek',
      display_name: 'DeepSeek Cloud',
      description: 'High-performance reasoning and coding foundation models (DeepSeek-V3, DeepSeek-R1)',
      website_url: 'https://api.deepseek.com',
      is_local: false,
    },
    {
      name: 'openrouter',
      display_name: 'OpenRouter Gateway',
      description: 'Unified API aggregator with dynamic fallback across 100+ frontier and open-source models',
      website_url: 'https://openrouter.ai',
      is_local: false,
    },
    {
      name: 'groq',
      display_name: 'Groq LPU Accelerator',
      description: 'Ultra-low latency Language Processing Unit (LPU) architecture for real-time agent loops',
      website_url: 'https://groq.com',
      is_local: false,
    },
    {
      name: 'mistral',
      display_name: 'Mistral AI',
      description: 'European frontier models specialized in code completion and multilingual reasoning (Codestral)',
      website_url: 'https://mistral.ai',
      is_local: false,
    },
    {
      name: 'together_ai',
      display_name: 'Together AI',
      description: 'Cloud infrastructure for open-source AI models with ultra-fast inference and fine-tuning',
      website_url: 'https://api.together.xyz',
      is_local: false,
    },
    {
      name: 'cohere',
      display_name: 'Cohere (Free Trial Tier)',
      description: 'Enterprise search, reranking, and multilingual generation models (Command R+, Aya Vision) with 1,000 free calls/mo',
      website_url: 'https://api.cohere.com/v2',
      is_local: false,
    },
    {
      name: 'cloudflare_workers_ai',
      display_name: 'Cloudflare Workers AI (Free Tier)',
      description: 'Global serverless GPU inference offering 10,000 neurons/day free (Llama 3.3 70B, Gemma 4, DeepSeek)',
      website_url: 'https://api.cloudflare.com/client/v4/ai',
      is_local: false,
    },
    {
      name: 'zhipu_ai',
      display_name: 'Zhipu AI (GLM Free Tier)',
      description: 'Permanent free tier reasoning and multimodal models (GLM-4.7-Flash, GLM-4.6V-Flash)',
      website_url: 'https://open.bigmodel.cn/api/paas/v4',
      is_local: false,
    },
    {
      name: 'aion_labs',
      display_name: 'Aion Labs (Free Tier)',
      description: 'Permanent free tier specialized for roleplay, storytelling, and reasoning (15 RPM, 20K tokens/day)',
      website_url: 'https://api.aionlabs.ai/v1',
      is_local: false,
    },
    {
      name: 'custom_openai_compatible',
      display_name: 'Custom OpenAI-Compatible / Free Proxy',
      description: 'Any self-hosted or free proxy following the standard /v1/chat/completions schema',
      website_url: 'http://localhost:8000/v1',
      is_local: true,
    },
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setNewProviderForm({
      name: preset.name,
      display_name: preset.display_name,
      description: preset.description,
      website_url: preset.website_url,
      is_local: preset.is_local,
    });
  };

  const handleSubmitNewProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddProvider || !newProviderForm.name.trim() || !newProviderForm.display_name.trim()) return;
    await onAddProvider(newProviderForm);
    setShowAddModal(false);
    setNewProviderForm({
      name: '',
      display_name: '',
      description: '',
      website_url: '',
      is_local: false,
    });
  };

  const handleProbe = async (providerName: string, req?: ProviderProbeRequest) => {
    if (!onProbeProvider) return;
    setProbingProvider(providerName);
    try {
      const res = await onProbeProvider(providerName, req);
      if (res) {
        setProbeResults((prev) => ({
          ...prev,
          [providerName]: res,
        }));
      }
    } finally {
      setProbingProvider(null);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            Active Provider Health Directory & Adapter Telemetry
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Operational status, live latency probes, simulated fault injection, and circuit breaker resilience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAddProvider && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary text-xs h-8 px-3 gap-1.5 font-mono shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Provider</span>
            </button>
          )}

          {onResetBreakers && (
            <button
              type="button"
              onClick={onResetBreakers}
              disabled={isResetting}
              className="btn btn-outline text-xs h-8 px-3 gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-mono"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Reset Breakers</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((p) => {
          const providerModels = models.filter((m) => m.provider_id === p.id || m.model_identifier.includes(p.name));
          const probeResult = probeResults[p.name];
          const isHealthy = probeResult ? probeResult.is_healthy : (p.is_healthy && p.consecutive_failures === 0);
          const breakerState = probeResult ? probeResult.circuit_breaker_status : (isHealthy ? 'CLOSED' : 'OPEN');
          const consecutiveFailures = probeResult ? probeResult.consecutive_failures : p.consecutive_failures;
          const isCurrentlyProbing = probingProvider === p.name;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 bg-card/90 backdrop-blur-md shadow-lg space-y-4 transition-all hover:border-primary/40 ${!isHealthy ? 'border-rose-500/40' : 'border-border'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-secondary text-primary">
                    {p.is_local ? <Server className="h-4 w-4 text-emerald-400" /> : <Cloud className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{p.display_name}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {p.is_local ? 'Air-Gapped Local' : 'Cloud API Adapter'}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${isHealthy
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                    }`}
                >
                  {isHealthy ? (
                    <>
                      <CheckCircle2 className="h-2.5 w-2.5" /> Healthy
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-2.5 w-2.5" /> Degraded
                    </>
                  )}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {p.description || 'Enterprise multi-tenant intelligence adapter conforming to vendor-neutral NEIMAN protocol.'}
              </p>

              {/* Health & Failure Metrics */}
              <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-secondary/40 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[9px] uppercase">Failures</span>
                  <span className={`font-bold ${consecutiveFailures > 0 ? 'text-rose-400' : 'text-foreground'}`}>
                    {consecutiveFailures} errors
                  </span>
                </div>

                <div className="bg-secondary/40 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[9px] uppercase">Breaker</span>
                  <span className={`font-bold ${breakerState === 'CLOSED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {breakerState}
                  </span>
                </div>
              </div>

              {/* Live Probe Telemetry Display */}
              {probeResult && (
                <div className="p-2.5 rounded-xl bg-background/80 border border-border/60 text-[10px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" /> Latency:
                    </span>
                    <span className="font-bold text-foreground">{probeResult.measured_latency_ms}ms</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate" title={probeResult.detail}>
                    {probeResult.detail}
                  </div>
                </div>
              )}

              {/* Live Probing Controls */}
              {onProbeProvider && (
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isCurrentlyProbing}
                    onClick={() => handleProbe(p.name)}
                    className="flex-1 btn btn-secondary text-[10px] h-7 px-2 font-mono flex items-center justify-center gap-1 hover:border-primary/50"
                  >
                    {isCurrentlyProbing ? (
                      <RotateCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3 text-cyan-400" />
                    )}
                    <span>Ping Probe</span>
                  </button>

                  <button
                    type="button"
                    title="Simulate 429 Rate Limit Error"
                    disabled={isCurrentlyProbing}
                    onClick={() => handleProbe(p.name, { simulate_error: 'rate_limit' })}
                    className="text-[10px] h-7 px-2 font-mono rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                  >
                    <span>Sim 429</span>
                  </button>

                  <button
                    type="button"
                    title="Simulate 500 Server Error to test circuit breaker trip"
                    disabled={isCurrentlyProbing}
                    onClick={() => handleProbe(p.name, { simulate_error: '500' })}
                    className="text-[10px] h-7 px-2 font-mono rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center gap-1"
                  >
                    <span>Sim 500</span>
                  </button>
                </div>
              )}

              {/* Associated Models Pill List */}
              <div className="pt-1">
                <span className="text-[10px] text-muted-foreground uppercase font-mono block mb-1.5">
                  Available Models ({providerModels.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {providerModels.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/80 border border-border text-foreground"
                    >
                      {m.model_identifier}
                    </span>
                  ))}
                  {providerModels.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60 italic">Integrated in routing pool</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Connect AI Provider / Gateway</h3>
                <p className="text-[11px] text-muted-foreground">
                  Register universal gateways (Kilo Code, Ollama, DeepSeek, OpenRouter) or private OpenAI-compatible nodes
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-secondary text-primary border border-border">
                BYOK / Auto-Routing
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Quick Integration Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((pr) => (
                  <button
                    key={pr.name}
                    type="button"
                    onClick={() => handleApplyPreset(pr)}
                    className="px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border/60 text-[10px] font-mono text-foreground hover:border-primary/50 transition-all flex items-center gap-1"
                  >
                    <span>{pr.display_name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitNewProvider} className="space-y-3 pt-2 border-t border-border/40">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-medium text-foreground mb-1">
                    Provider ID <span className="text-[#D71921]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full text-xs font-mono"
                    placeholder="e.g. kilocode, ollama, deepseek"
                    value={newProviderForm.name}
                    onChange={(e) =>
                      setNewProviderForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-foreground mb-1">
                    Display Name <span className="text-[#D71921]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input w-full text-xs"
                    placeholder="e.g. Kilo Code Gateway"
                    value={newProviderForm.display_name}
                    onChange={(e) => setNewProviderForm((f) => ({ ...f, display_name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Gateway / Endpoint URL
                </label>
                <input
                  type="url"
                  className="input w-full text-xs font-mono"
                  placeholder="https://api.kilo.ai/api/gateway or http://localhost:11434"
                  value={newProviderForm.website_url}
                  onChange={(e) => setNewProviderForm((f) => ({ ...f, website_url: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Description & Capabilities
                </label>
                <textarea
                  rows={2}
                  className="input w-full text-xs h-auto resize-none"
                  placeholder="Universal multi-model coding gateway connecting frontier models with native tool use..."
                  value={newProviderForm.description}
                  onChange={(e) => setNewProviderForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/60">
                <input
                  type="checkbox"
                  id="is_local_toggle"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={newProviderForm.is_local}
                  onChange={(e) => setNewProviderForm((f) => ({ ...f, is_local: e.target.checked }))}
                />
                <label htmlFor="is_local_toggle" className="text-xs text-foreground cursor-pointer select-none">
                  <span className="font-semibold">Local / On-Premise Air-Gapped Node</span>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Routes without external network traffic (Zero Data Retention)
                  </p>
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  className="btn btn-outline flex-1 text-xs font-mono"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProvider || !newProviderForm.name.trim() || !newProviderForm.display_name.trim()}
                  className="btn btn-primary flex-1 text-xs font-mono"
                >
                  {isAddingProvider ? 'Registering...' : 'Register Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
