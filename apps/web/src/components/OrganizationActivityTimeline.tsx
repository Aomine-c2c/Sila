'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Shield,
  Bot,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { AuditLog } from '@/lib/api/controlRoom';

interface OrganizationActivityTimelineProps {
  audits: AuditLog[];
  maxItems?: number;
}

export function OrganizationActivityTimeline({
  audits,
  maxItems = 6,
}: OrganizationActivityTimelineProps) {
  // Sort audits chronologically, newest first
  const displayAudits = audits.slice(0, maxItems);

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return 'Now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return 'Recently';
    }
  };

  const getStatusIndicator = (action: string, result?: string) => {
    const act = (action + ' ' + (result || '')).toLowerCase();
    if (act.includes('approval') || act.includes('request') || act.includes('pending')) {
      return {
        dotClass: 'bg-amber-400 ring-amber-400/20',
        textClass: 'text-amber-400',
        icon: Shield,
      };
    }
    if (act.includes('blocked') || act.includes('denied') || act.includes('paused') || act.includes('concern')) {
      return {
        dotClass: 'bg-rose-400 ring-rose-400/20',
        textClass: 'text-rose-400',
        icon: AlertTriangle,
      };
    }
    return {
      dotClass: 'bg-emerald-400 ring-emerald-400/20',
      textClass: 'text-emerald-400',
      icon: CheckCircle2,
    };
  };

  return (
    <div className="space-y-4">
      {displayAudits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
          <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground/60" />
          <p>No operational events recorded yet.</p>
          <span className="text-[10px] text-muted-foreground/60 mt-1 block">
            Actions performed by agents and councils will appear here in real-time.
          </span>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border/80">
          {displayAudits.map((item, idx) => {
            const time = formatTimestamp(item.created_at);
            const style = getStatusIndicator(item.action, item.result);
            const Icon = style.icon;

            return (
              <div key={item.id || idx} className="relative group text-xs">
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full ${style.dotClass} ring-4 bg-background border border-border`}
                />

                <div className="rounded-xl border border-border/50 bg-secondary/30 p-2.5 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-foreground/90">
                      {time}
                    </span>
                    {item.result && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border border-border/60 ${style.textClass}`}>
                        {item.result}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-foreground font-medium">
                    <span className="text-primary font-semibold mr-1.5">
                      {item.actor_type === 'AGENT' ? '🤖' : '👤'} {item.action}
                    </span>
                    {item.target && <span className="text-muted-foreground font-normal">on {item.target}</span>}
                  </p>

                  {item.reason && (
                    <p className="mt-1 text-[11px] text-muted-foreground/80 line-clamp-2">
                      {item.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
