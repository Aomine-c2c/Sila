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
} from 'lucide-react';
import { ModelProvider, Model, ProviderProbeRequest, ProviderProbeResponse } from '@/lib/api/intelligence';

interface ProviderDirectoryProps {
  providers: ModelProvider[];
  models: Model[];
  onResetBreakers?: () => void;
  isResetting?: boolean;
  onProbeProvider?: (providerName: string, req?: ProviderProbeRequest) => Promise<ProviderProbeResponse | void>;
}

export function ProviderDirectory({
  providers,
  models,
  onResetBreakers,
  isResetting,
  onProbeProvider,
}: ProviderDirectoryProps) {
  const [probingProvider, setProbingProvider] = useState<string | null>(null);
  const [probeResults, setProbeResults] = useState<Record<string, ProviderProbeResponse>>({});

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

        {onResetBreakers && (
          <button
            type="button"
            onClick={onResetBreakers}
            disabled={isResetting}
            className="btn btn-outline text-xs h-8 px-3 gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Reset All Breakers</span>
          </button>
        )}
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
    </div>
  );
}
