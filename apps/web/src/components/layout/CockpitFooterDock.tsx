'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Brain,
  FlaskConical,
  Sparkles,
  FileText,
  Scale,
  Database,
  Activity,
  Boxes,
  Layers,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemDockItem {
  id: string;
  name: string;
  shortLabel: string;
  code: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  category: 'INTELLIGENCE' | 'GOVERNANCE' | 'TOPOLOGY';
}

const SYSTEM_DOCK_ITEMS: SystemDockItem[] = [
  // 1. Intelligence (Cyan accent)
  { id: 'intelligence', name: 'Router & Models', shortLabel: 'Router', code: 'RT', href: '/dashboard/intelligence', icon: Zap, badge: 'Engine', category: 'INTELLIGENCE' },
  { id: 'memory', name: 'Org Memory', shortLabel: 'Memory', code: 'MM', href: '/dashboard/memory', icon: Brain, category: 'INTELLIGENCE' },
  { id: 'simulation', name: 'Simulation Lab', shortLabel: 'Simulation', code: 'SM', href: '/dashboard/simulation', icon: FlaskConical, category: 'INTELLIGENCE' },
  { id: 'evolution', name: 'Evolution Center', shortLabel: 'Evolution', code: 'EV', href: '/dashboard/evolution', icon: Sparkles, category: 'INTELLIGENCE' },

  // 2. Governance & Compliance (Amber accent)
  { id: 'governance', name: 'Constitution & Rules', shortLabel: 'Constitution', code: 'CS', href: '/dashboard/governance', icon: FileText, category: 'GOVERNANCE' },
  { id: 'decisions', name: 'Decisions Ledger', shortLabel: 'Decisions', code: 'DC', href: '/dashboard/decisions', icon: Scale, category: 'GOVERNANCE' },
  { id: 'resources', name: 'Resource Allocation', shortLabel: 'Resources', code: 'RS', href: '/dashboard/resources', icon: Database, category: 'GOVERNANCE' },
  { id: 'activity', name: 'Activity Stream', shortLabel: 'Activity', code: 'AC', href: '/dashboard/activity', icon: Activity, category: 'GOVERNANCE' },

  // 3. Topology & Administration (Purple accent)
  { id: 'organizations', name: 'Organizations', shortLabel: 'Orgs', code: 'OG', href: '/dashboard/organizations', icon: Users, category: 'TOPOLOGY' },
  { id: 'blueprints', name: 'Blueprints Studio', shortLabel: 'Blueprints', code: 'BP', href: '/dashboard/blueprints', icon: Boxes, badge: 'Studio', category: 'TOPOLOGY' },
  { id: 'organization', name: 'Org Topology Map', shortLabel: 'Org Map', code: 'MP', href: '/dashboard/organization', icon: Layers, category: 'TOPOLOGY' },
  { id: 'settings', name: 'Administration', shortLabel: 'Settings', code: 'ST', href: '/dashboard/settings', icon: Settings, badge: 'Admin', category: 'TOPOLOGY' },
];

const CATEGORY_META = {
  INTELLIGENCE: {
    title: 'Intelligence Engines',
    tag: 'INTEL',
    colorText: 'text-cyan-400',
    colorBorder: 'border-cyan-500/30',
    colorPip: 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]',
    activeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40',
  },
  GOVERNANCE: {
    title: 'Governance & Ledger',
    tag: 'GOV',
    colorText: 'text-amber-400',
    colorBorder: 'border-amber-500/30',
    colorPip: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
    activeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  },
  TOPOLOGY: {
    title: 'Topology & Setup',
    tag: 'TOPO',
    colorText: 'text-purple-400',
    colorBorder: 'border-purple-500/30',
    colorPip: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
    activeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/40',
  },
};

interface CockpitFooterDockProps {
  onOpenDrawer?: (drawerId: string) => void;
  activeDrawerId?: string | null;
}

export function CockpitFooterDock({ onOpenDrawer, activeDrawerId }: CockpitFooterDockProps) {
  const pathname = usePathname();

  const isActive = (id: string, href: string) => {
    if (activeDrawerId) return activeDrawerId === id;
    return pathname.startsWith(href);
  };

  const categories: Array<{
    key: 'INTELLIGENCE' | 'GOVERNANCE' | 'TOPOLOGY';
    items: SystemDockItem[];
  }> = [
    { key: 'INTELLIGENCE', items: SYSTEM_DOCK_ITEMS.filter((i) => i.category === 'INTELLIGENCE') },
    { key: 'GOVERNANCE', items: SYSTEM_DOCK_ITEMS.filter((i) => i.category === 'GOVERNANCE') },
    { key: 'TOPOLOGY', items: SYSTEM_DOCK_ITEMS.filter((i) => i.category === 'TOPOLOGY') },
  ];

  return (
    <footer
      className="sticky bottom-0 z-30 flex h-12 shrink-0 items-center justify-between border-t border-border/80 bg-background/90 backdrop-blur-xl px-3 lg:px-6 select-none font-mono text-xs"
      role="navigation"
      aria-label="System and governance bottom dock"
    >
      {/* Left indicator with Nothing OS dot-matrix styling */}
      <div className="hidden xl:flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest shrink-0 font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D71921] shadow-[0_0_6px_#D71921]" />
        <span className="font-semibold text-foreground tracking-widest">COCKPIT // SYS</span>
      </div>

      {/* Center: System dock items grouped with Nothing OS glyph pills */}
      <div className="flex items-center gap-1 sm:gap-2 max-w-full overflow-x-auto scrollbar-hide py-1">
        {categories.map((cat, idx) => {
          const meta = CATEGORY_META[cat.key];
          return (
            <React.Fragment key={cat.key}>
              {idx > 0 && (
                <div className="h-3.5 w-px bg-border/60 mx-1 shrink-0" aria-hidden="true" />
              )}
              <div className="flex items-center gap-1 shrink-0">
                {/* Category mini label on wide screens */}
                <span
                  className={cn(
                    'text-[9px] uppercase tracking-wider font-mono font-bold mr-0.5 hidden 2xl:inline opacity-70',
                    meta.colorText
                  )}
                >
                  {meta.tag}
                </span>

                {cat.items.map((item) => {
                  const active = isActive(item.id, item.href);
                  const Icon = item.icon;

                  const handleClick = (e: React.MouseEvent) => {
                    if (onOpenDrawer) {
                      e.preventDefault();
                      onOpenDrawer(item.id);
                    }
                  };

                  return (
                    <div key={item.id} className="relative group">
                      <Link
                        href={item.href}
                        onClick={handleClick}
                        aria-current={active ? 'page' : undefined}
                        aria-label={item.name}
                        className={cn(
                          'relative flex h-7.5 px-2.5 items-center gap-1.5 rounded-full text-xs font-mono transition-all duration-150',
                          active
                            ? 'bg-foreground text-background shadow-xs font-semibold'
                            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-border/40'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                            active ? 'text-[#D71921]' : 'text-muted-foreground group-hover:text-foreground'
                          )}
                          aria-hidden="true"
                        />
                        {/* Short code on smaller viewports, label on large */}
                        <span className="text-[10px] uppercase tracking-wider lg:hidden font-mono">
                          {item.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider hidden lg:inline font-mono">
                          {item.shortLabel}
                        </span>

                        {/* Active Indicator Red Pip */}
                        {active && (
                          <span
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#D71921] shadow-[0_0_6px_#D71921]"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      {/* Nothing OS Flyout Tooltip */}
                      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-[11px] font-mono tracking-tight text-foreground shadow-2xl backdrop-blur-xl group-hover:flex z-50 whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                        <span className={cn('text-[9px] font-bold uppercase', meta.colorText)}>
                          [{meta.tag}]
                        </span>
                        <span className="font-semibold uppercase tracking-wider">{item.name}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] bg-secondary text-muted-foreground uppercase border border-border/50">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground/60 border-l border-border/60 pl-2">
                          Cmd+K → {item.shortLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Right mini telemetry indicator with Nothing dot */}
      <div className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground uppercase shrink-0 font-mono">
        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
        <span className="text-muted-foreground font-mono tracking-wider">NEIMAN OS 0.3.0</span>
      </div>
    </footer>
  );
}
