'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  Briefcase,
  Zap,
  CheckSquare,
  Shield,
  Layers,
  Activity,
  Brain,
  Sparkles,
  Scale,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Compass,
  Database,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Systems',
    items: [
      { id: 'control-room', name: 'Control Room', href: '/dashboard', icon: LayoutDashboard },
      { id: 'organizations', name: 'Organizations', href: '/dashboard/organizations', icon: Users },
      { id: 'blueprints', name: 'Blueprints', href: '/dashboard/blueprints', icon: Boxes, badge: 'Studio' },
      { id: 'organization', name: 'Org Map', href: '/dashboard/organization', icon: Layers },
    ],
  },
  {
    title: 'Workforce & Execution',
    items: [
      { id: 'agents', name: 'AI Workforce', href: '/dashboard/agents', icon: Bot, badge: 'Live' },
      { id: 'councils', name: 'Agent Councils', href: '/dashboard/councils', icon: Users },
      { id: 'workflows', name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch },
      { id: 'projects', name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
      { id: 'tasks', name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'intelligence', name: 'Router & Models', href: '/dashboard/intelligence', icon: Zap, badge: 'Engine' },
      { id: 'memory', name: 'Org Memory', href: '/dashboard/memory', icon: Brain },
      { id: 'simulation', name: 'Simulation Lab', href: '/dashboard/simulation', icon: FlaskConical },
      { id: 'evolution', name: 'Evolution Center', href: '/dashboard/evolution', icon: Sparkles },
    ],
  },
  {
    title: 'Governance & Resources',
    items: [
      { id: 'governance', name: 'Constitution & Rules', href: '/dashboard/governance', icon: FileText },
      { id: 'approvals', name: 'Approvals Gate', href: '/dashboard/approvals', icon: Shield, badge: 'Auth' },
      { id: 'decisions', name: 'Decisions Ledger', href: '/dashboard/decisions', icon: Scale },
      { id: 'resources', name: 'Resource Allocation', href: '/dashboard/resources', icon: Database },
      { id: 'activity', name: 'Activity Stream', href: '/dashboard/activity', icon: Activity },
      { id: 'settings', name: 'Administration', href: '/dashboard/settings', icon: Settings, badge: 'Admin' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Load persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('NEIMAN-sidebar-collapsed');
        if (saved !== null) {
          setCollapsed(saved === 'true');
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('NEIMAN-sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 ease-in-out select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-border/80">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 transition-opacity duration-200 overflow-hidden',
            collapsed ? 'justify-center w-full' : 'px-2'
          )}
          title="NEIMAN Core"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary shadow-sm shadow-primary/20">
            <Compass className="h-4 w-4 animate-[spin_12s_linear_infinite]" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                NEIMAN
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Autonomous OS
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6 scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">
                {section.title}
              </h4>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150',
                      active
                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10 font-semibold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1 tracking-tight">
                        {item.name}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <Badge
                        variant={active ? 'cyber' : 'outline'}
                        className="text-[9px] px-1.5 py-0 h-4 uppercase shrink-0"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {/* Active Pip Indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-border/80 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleCollapse}
          className={cn(
            'flex h-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground hover:border-primary/40 focus:outline-none',
            collapsed ? 'w-full' : 'w-full gap-2 px-3 text-xs'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider">Collapse Nav</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
