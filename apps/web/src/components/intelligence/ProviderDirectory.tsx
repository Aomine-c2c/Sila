'use client';

import React from 'react';
import {
  Cloud,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  Shield,
  RotateCw,
  Cpu,
} from 'lucide-react';
import { ModelProvider, Model } from '@/lib/api/intelligence';

interface ProviderDirectoryProps {
  providers: ModelProvider[];
  models: Model[];
  onResetBreakers?: () => void;
  isResetting?: boolean;
}

export function ProviderDirectory({
  providers,
  models,
  onResetBreakers,
  isResetting,
}: ProviderDirectoryProps) {
  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            Active Provider Health Directory & Adapter Telemetry
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Operational status, latency profiles, consecutive failures, and circuit breaker health across cloud and on-premise adapters.
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
          const isHealthy = p.is_healthy && p.consecutive_failures === 0;

          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 bg-card/90 backdrop-blur-md shadow-lg space-y-4 transition-all hover:border-primary/40 ${
                !isHealthy ? 'border-rose-500/40' : 'border-border'
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
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                    isHealthy
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
                {p.description || 'Enterprise multi-tenant intelligence adapter conforming to vendor-neutral NEXORA protocol.'}
              </p>

              {/* Health & Failure Metrics */}
              <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-secondary/40 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[9px] uppercase">Failures</span>
                  <span className={`font-bold ${p.consecutive_failures > 0 ? 'text-rose-400' : 'text-foreground'}`}>
                    {p.consecutive_failures} errors
                  </span>
                </div>

                <div className="bg-secondary/40 p-2 rounded-lg border border-border/40">
                  <span className="text-muted-foreground block text-[9px] uppercase">Breaker</span>
                  <span className={`font-bold ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isHealthy ? 'CLOSED' : 'OPEN'}
                  </span>
                </div>
              </div>

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
