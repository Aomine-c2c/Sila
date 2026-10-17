'use client';

import React from 'react';
import {
  X,
  Bot,
  Layers,
  GitFork,
  Zap,
  Database,
  Sparkles,
  Shield,
  Activity,
  Terminal,
  ArrowRight,
  ExternalLink,
  Play,
  Pause,
  AlertTriangle,
  Clock,
  Coins,
} from 'lucide-react';
import type { CoreNode } from './CognitiveCore';

interface ContextualInspectorProps {
  node: CoreNode | null;
  onClose: () => void;
  onOpenDrawer?: (drawerId: string) => void;
  onExecuteCommand?: (command: string) => void;
}

export function ContextualInspector({
  node,
  onClose,
  onOpenDrawer,
  onExecuteCommand,
}: ContextualInspectorProps) {
  if (!node) return null;

  return (
    <div className="absolute right-4 top-14 z-40 w-80 rounded-xl border border-cyan-500/30 bg-background/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] font-mono text-xs overflow-hidden animate-fade-in select-text">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40 bg-secondary/30">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: `#${node.colorHex.toString(16).padStart(6, '0')}` }}
          />
          <div className="min-w-0">
            <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">
              {node.type} // {node.status}
            </span>
            <p className="text-xs font-bold text-foreground truncate">{node.name}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3.5 space-y-3 max-h-96 overflow-y-auto">
        {/* Type Specific Diagnostics */}
        {node.type === 'agent' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Autonomy Level</span>
                <span className="text-foreground font-bold">{node.autonomy || 'AUTONOMOUS'}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Model Assigned</span>
                <span className="text-cyan-400 font-bold">{node.assignedModel || 'Claude 3.5 Sonnet'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground uppercase block mb-1">Active Sub-Task</span>
              <div className="p-2 rounded bg-secondary/20 border border-border/20 text-[11px] text-foreground">
                {node.currentTask || 'Coordinating consensus across execution pipeline'}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground uppercase block mb-1">Telemetry Trace</span>
              <div className="p-2 rounded bg-black/40 border border-cyan-500/20 text-[10px] text-cyan-400/90 font-mono space-y-0.5">
                <div>[16:51:02] Token window: 42.8k / 200k</div>
                <div>[16:51:14] Memory vectors queried: 14 matches</div>
                <div>[16:51:28] Quorum verification: PASSED (3/3)</div>
              </div>
            </div>
          </div>
        )}

        {node.type === 'department' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Head Agent</span>
                <span className="text-foreground font-bold">Chief Architect</span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Active Workers</span>
                <span className="text-emerald-400 font-bold">4 Active / 2 Standby</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block mb-1">Resource Quota</span>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>CGroup Allocation</span>
                  <span className="text-foreground font-bold">45.0%</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 w-[45%]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {node.type === 'model' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Roundtrip Latency</span>
                <span className="text-emerald-400 font-bold">{node.latency || '240ms'}</span>
              </div>
              <div className="p-2 rounded bg-secondary/30 border border-border/30">
                <span className="text-muted-foreground block text-[9px] uppercase">Cost Velocity</span>
                <span className="text-foreground font-bold">{node.cost || '$3.00/M'}</span>
              </div>
            </div>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              <span>Multi-Region Circuit Resilient · Zero Faults</span>
            </div>
          </div>
        )}

        {node.type === 'task' && (
          <div className="space-y-2.5">
            <div className="p-2 rounded bg-secondary/30 border border-border/30 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Execution Priority:</span>
                <span className="text-amber-400 font-bold">HIGH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Tokens:</span>
                <span className="text-foreground">~8,400 tokens</span>
              </div>
            </div>
          </div>
        )}

        {node.type === 'evolution' && (
          <div className="space-y-2.5">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300">
              <span className="font-bold block">Autonomous Mutation Candidate</span>
              <span className="text-[9px] text-muted-foreground">
                Validation engine benchmarked +34% throughput improvements with zero regressions.
              </span>
            </div>
          </div>
        )}

        {/* Global Action Trigger Bar */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenDrawer?.(node.type === 'agent' ? 'agents' : 'tasks')}
            className="flex-1 py-1.5 px-2 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 transition-colors font-bold text-[10px] flex items-center justify-center gap-1.5"
          >
            <span>Full Inspector</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onExecuteCommand?.(`inspect ${node.id}`)}
            className="p-1.5 rounded border border-border bg-secondary hover:bg-secondary/70 text-foreground transition-colors"
            title="Send to Terminal"
          >
            <Terminal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
