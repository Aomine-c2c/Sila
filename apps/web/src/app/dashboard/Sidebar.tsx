'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bot,
  GitBranch,
  Brain,
  Database,
  Shield,
  FileText,
  Settings,
  Menu,
  X,
  ChevronRight,
  Building2,
  Zap,
  Scale,
  Sparkles,
  FolderKanban,
  CheckSquare,
  FlaskConical,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAVIGATION_GROUPS = [
  {
    label: 'OPERATE',
    items: [
      { name: 'Control room', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
      { name: 'Departments', href: '/dashboard/departments', icon: Users },
      { name: 'Agents', href: '/dashboard/agents', icon: Bot },
      { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
      { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
      { name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch },
      { name: 'Councils', href: '/dashboard/councils', icon: Users },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { name: 'Provider mesh', href: '/dashboard/intelligence', icon: Zap },
      { name: 'Org memory', href: '/dashboard/memory', icon: Brain },
      { name: 'Evolution lab', href: '/dashboard/evolution', icon: Sparkles },
      { name: 'Simulation lab', href: '/dashboard/simulation', icon: FlaskConical },
    ],
  },
  {
    label: 'GOVERN',
    items: [
      { name: 'Decisions', href: '/dashboard/decisions', icon: Scale },
      { name: 'Approvals', href: '/dashboard/approvals', icon: ShieldCheck },
      { name: 'Activity', href: '/dashboard/activity', icon: Sparkles },
      { name: 'Governance', href: '/dashboard/governance', icon: Shield },
      { name: 'Resources', href: '/dashboard/resources', icon: Database },
      { name: 'Blueprints', href: '/dashboard/blueprints', icon: FileText },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" aria-label="Main navigation">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          {!collapsed && (
            <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.2em] text-muted-foreground/65 uppercase">
              {group.label}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.name : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'sidebar-item group h-9 rounded-lg px-2.5 text-[13px] flex items-center gap-2.5 transition-colors',
                    collapsed && 'justify-center px-0',
                    active && 'sidebar-item-active'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                  {!collapsed && active && (
                    <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="fixed left-4 top-3.5 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-nexora-surface text-muted-foreground hover:text-foreground lg:hidden shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop & Mobile drawer aside */}
      <aside
        className={cn(
          'nexora-sidebar fixed left-0 top-0 z-50 h-screen border-r border-border transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-[252px]',
          mobileOpen ? 'translate-x-0 w-[252px]' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className={cn(
              'flex h-16 items-center justify-between border-b border-border/80 px-4',
              collapsed && 'justify-center px-0'
            )}
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setMobileOpen(false)}
            >
              <div className="nexora-mark relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <span className="font-mono text-sm font-black tracking-tighter">N</span>
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-nexora-surface bg-primary" />
              </div>
              {!collapsed && (
                <div>
                  <span className="block text-[13px] font-bold tracking-[0.14em] text-foreground">
                    NEXORA
                  </span>
                  <span className="block text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    Organization OS
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Desktop collapse toggle button */}
            {onToggleCollapse && (
              <button
                type="button"
                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-secondary hover:text-foreground"
                onClick={onToggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <NavLinks collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

          {/* Footer Settings */}
          <div className="border-t border-border/80 p-3">
            <Link
              href="/dashboard/settings"
              title={collapsed ? 'Settings' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/60 p-2.5 transition-colors hover:border-primary/30',
                collapsed && 'justify-center p-2'
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Settings className="h-3.5 w-3.5" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">Settings</p>
                  <p className="text-[10px] text-muted-foreground truncate">Policies & access</p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <p className="mt-2 px-1 font-mono text-[8px] tracking-wider text-muted-foreground/45 uppercase text-center">
                Nexora Core Engine
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
