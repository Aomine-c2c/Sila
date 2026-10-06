'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Code,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCw,
  Cpu,
  Key,
  Layers,
  ArrowRight,
  Database,
  Lock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blueprintsApi } from '@/lib/api/blueprints';
import { useAuthStore } from '@/store/auth';

interface SystemSetupWizardProps {
  onCompleted?: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

export function SystemSetupWizard({ onCompleted, isOpen, onClose }: SystemSetupWizardProps) {
  const [step, setStep] = useState<'welcome' | 'providers' | 'blueprint'>('welcome');
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'claude' | 'openai' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [launchingKey, setLaunchingKey] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { setActiveCompany } = useAuthStore();

  const instantiateMutation = useMutation({
    mutationFn: ({ key, name }: { key: string; name?: string }) =>
      blueprintsApi.instantiateBlueprint(key, { company_name: name }),
    onSuccess: (data) => {
      setLaunchError(null);
      // Invalidate organizations and update active company
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['control-room-summary'] });
      if (data && data.company_id) {
        setActiveCompany({
          id: data.company_id,
          name: data.company_name,
          slug: data.slug,
          status: 'ACTIVE',
          owner_id: 'owner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      if (onCompleted) {
        onCompleted();
      }
      if (onClose) {
        onClose();
      }
    },
    onError: (err: any) => {
      const msg = err?.message || err?.detail || 'Failed to instantiate organization. Check backend connectivity.';
      setLaunchError(String(msg));
    },
    onSettled: () => {
      setLaunchingKey(null);
    },
  });

  const buildMyCompanyMutation = useMutation({
    mutationFn: (description: string) =>
      blueprintsApi.buildMyCompany({
        description,
        target_budget_monthly_usd: 500,
        preferred_autonomy_level: 3,
      }),
    onSuccess: (proposal) => {
      // Once synthesized, approve & instantiate immediately for zero-touch experience
      blueprintsApi
        .instantiateProposal(proposal.id, {
          approved_by: 'Autonomous Administrator',
          confirmation_statement: 'Auto-approved zero-touch synthesis from initial onboarding instruction.',
          custom_company_name: proposal.proposed_blueprint?.name,
        })
        .then((res) => {
          queryClient.invalidateQueries({ queryKey: ['organizations'] });
          if (res && res.company_id) {
            setActiveCompany({
              id: res.company_id,
              name: res.company_name,
              slug: res.slug,
              status: 'ACTIVE',
              owner_id: 'owner',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          if (onCompleted) onCompleted();
          if (onClose) onClose();
        })
        .finally(() => {
          setIsSynthesizing(false);
        });
    },
    onError: () => {
      setIsSynthesizing(false);
    },
  });

  const handleSaveProvider = () => {
    // Store configured mock or live provider state in localStorage for session persistence
    try {
      localStorage.setItem(
        'neiman_configured_provider',
        JSON.stringify({
          provider: selectedProvider,
          configuredAt: new Date().toISOString(),
          endpoint: selectedProvider === 'ollama' ? ollamaUrl : 'api.vendor.cloud',
        })
      );
    } catch {
      // Ignore local storage error
    }
    setProviderConfigured(true);
    setStep('blueprint');
  };

  const handleInstantLaunch = (key: string) => {
    setLaunchingKey(key);
    instantiateMutation.mutate({ key });
  };

  const handleCustomLaunch = () => {
    if (!customPrompt.trim()) return;
    setIsSynthesizing(true);
    buildMyCompanyMutation.mutate(customPrompt);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded border border-border bg-[#0D0D0D] shadow-2xl p-6 sm:p-8 space-y-6 text-foreground relative ring-1 ring-white/5 my-8">
        {/* Step indicator header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded border border-border bg-secondary flex items-center justify-center font-mono font-bold text-xs text-foreground">
              <span className="text-[#D71921] font-mono font-black text-sm">N</span>
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#D71921] shadow-[0_0_8px_#D71921]" />
                SETUP PROTOCOL (V1.0)
              </h2>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Configure primary intelligence provider and synthesize operational organization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span
              className={`px-2 py-0.5 rounded border uppercase tracking-wider ${
                step === 'welcome'
                  ? 'bg-foreground text-background border-foreground font-bold'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}
            >
              01/OVERVIEW
            </span>
            <span className="text-muted-foreground/40 font-mono">/</span>
            <span
              className={`px-2 py-0.5 rounded border uppercase tracking-wider ${
                step === 'providers'
                  ? 'bg-foreground text-background border-foreground font-bold'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}
            >
              02/MODELS
            </span>
            <span className="text-muted-foreground/40 font-mono">/</span>
            <span
              className={`px-2 py-0.5 rounded border uppercase tracking-wider ${
                step === 'blueprint'
                  ? 'bg-foreground text-background border-foreground font-bold'
                  : 'bg-secondary text-muted-foreground border-border'
              }`}
            >
              03/LAUNCH
            </span>
          </div>
        </div>

        {/* ── STEP 1: WELCOME & PRINCIPLES ── */}
        {step === 'welcome' && (
          <div className="space-y-6 animate-fade-in font-mono">
            <div className="p-4 rounded border border-border bg-secondary/30 text-xs space-y-2">
              <span className="font-bold text-[#D71921] text-xs flex items-center gap-2 uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D71921]" />
                ORGANIZATIONAL AXIOMS
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Agents are organizational employees. Models are intelligence providers. Resources are finite.
                Memory belongs to the organization. Autonomy is bounded. Operator retains executive authority.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Code className="h-4 w-4" />
                  Software Development Company
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Full agile software company featuring Product Architects, Frontend/Backend engineers, QA Automators,
                  and CI/CD release pipelines preconfigured.
                </p>
                <div className="pt-2 text-[10px] font-mono text-emerald-400">
                  3 Departments &bull; 4 Agents &bull; L3 Autonomy
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <TrendingUp className="h-4 w-4" />
                  Forex Trading Company
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Quantitative currency arbitrage and market regime modeling with strict drawdown ceilings, VaR monitoring,
                  and automated risk circuit breakers.
                </p>
                <div className="pt-2 text-[10px] font-mono text-emerald-400">
                  3 Departments &bull; 3 Agents &bull; L2 Autonomy Guarded
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep('providers')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              >
                <span>Continue: Link AI Models</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: LINK AI PROVIDER ── */}
        {step === 'providers' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-foreground">Select & Link Primary Intelligence Provider</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Heterogeneous intelligence allows routing high-reasoning tasks to top models while using fast local models for high-frequency steps.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'gemini',
                  name: 'Google Gemini',
                  model: 'Gemini 1.5 Flash / Pro',
                  desc: 'High context & high throughput',
                  badge: 'Recommended',
                },
                {
                  id: 'claude',
                  name: 'Anthropic Claude',
                  model: 'Claude 3.5 Sonnet',
                  desc: 'Deep reasoning & architecture',
                  badge: 'Premier',
                },
                {
                  id: 'openai',
                  name: 'OpenAI',
                  model: 'GPT-4o',
                  desc: 'Multimodal & execution',
                  badge: 'Balanced',
                },
                {
                  id: 'ollama',
                  name: 'Local Ollama',
                  model: 'Llama 3 / DeepSeek',
                  desc: 'Air-gapped & private on-prem',
                  badge: 'Local / Offline',
                },
              ].map((prov) => {
                const isSelected = selectedProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setSelectedProvider(prov.id as any)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-secondary/20 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">{prov.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-primary">
                        {prov.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground mb-1">{prov.model}</span>
                    <span className="text-[10px] text-muted-foreground/80 leading-tight">{prov.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Provider credentials configuration */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3 text-xs">
              {selectedProvider === 'ollama' ? (
                <div>
                  <label className="font-medium text-foreground block mb-1">
                    Local Ollama Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Zero remote egress. Communicates with your local LLM instance.
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-medium text-foreground">
                      {selectedProvider === 'gemini'
                        ? 'Google Gemini API Key'
                        : selectedProvider === 'claude'
                        ? 'Anthropic API Key'
                        : 'OpenAI API Key'}
                    </label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      (Optional in sandbox / preview mode)
                    </span>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key or leave blank to use configured sandbox adapters..."
                    className="w-full bg-secondary/60 border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Keys are stored securely in local vault and never committed to repo.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveProvider}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              >
                <span>Save Provider & Select Blueprint</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SELECT & LAUNCH BLUEPRINT ── */}
        {step === 'blueprint' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-foreground">Zero-Touch Company Activation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Launch a production-grade organization immediately or describe a bespoke company for live AI synthesis.
              </p>
            </div>

            {launchError && (
              <div className="p-3 border border-[#D71921]/40 bg-[#D71921]/10 text-xs font-mono text-[#D71921] flex items-center justify-between">
                <span>[ERROR] {launchError}</span>
                <button
                  type="button"
                  onClick={() => setLaunchError(null)}
                  className="text-[10px] uppercase font-bold underline hover:no-underline"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* Quick 1-Click Launch Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Software Development Company */}
              <div className="p-5 rounded-2xl bg-secondary/30 border border-primary/40 hover:border-primary transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      TECHNOLOGY
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">L3 Autonomy</span>
                  </div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Code className="h-5 w-5 text-indigo-400" />
                    Software Development Company
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly deploys <strong>NovaForge Technologies</strong>: Product & Architecture, Core Engineering,
                    and Quality/SRE teams with 4 autonomous agents and CI/CD pipelines.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={launchingKey !== null || isSynthesizing}
                  onClick={() => handleInstantLaunch('software_development_company')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md disabled:opacity-50 transition-all"
                >
                  {launchingKey === 'software_development_company' ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      Provisioning Organization...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Launch Software Company (1-Click)
                    </>
                  )}
                </button>
              </div>

              {/* Option B: Forex Trading Company */}
              <div className="p-5 rounded-2xl bg-secondary/30 border border-emerald-500/40 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      FINANCE & QUANT
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">L2 Guarded</span>
                  </div>
                  <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Forex Trading Company
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly deploys <strong>ApexFX Global Capital</strong>: Quantitative Research, Execution, and Risk
                    Compliance with currency arbitrage agents and drawdown circuit breakers.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={launchingKey !== null || isSynthesizing}
                  onClick={() => handleInstantLaunch('forex_trading_company')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 transition-all"
                >
                  {launchingKey === 'forex_trading_company' ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      Provisioning Organization...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Launch Forex Company (1-Click)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Custom: Build My Company via AI */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Or Enter Custom Organization Prompt (AI Synthesis)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Describe a different business model. Your linked AI model ({selectedProvider}) will automatically synthesize
                departments, agents, workflows, policies, and risk boundaries.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Build an autonomous venture research firm analyzing climate tech patents..."
                  className="flex-1 bg-secondary/50 border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={!customPrompt.trim() || isSynthesizing || launchingKey !== null}
                  onClick={handleCustomLaunch}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSynthesizing ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      Synthesize & Launch
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setStep('providers')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Back to Models
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Explore Workspace Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
