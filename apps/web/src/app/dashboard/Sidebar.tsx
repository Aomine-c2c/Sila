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
  Layers,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Control Room', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch },
  { name: 'Councils', href: '/dashboard/councils', icon: Users },
  { name: 'Memory', href: '/dashboard/memory', icon: Brain },
  { name: 'Governance', href: '/dashboard/governance', icon: Shield },
  { name: 'Resources', href: '/dashboard/resources', icon: Database },
  { name: 'Blueprints', href: '/dashboard/blueprints', icon: FileText },
  { name: 'Intelligence', href: '/dashboard/intelligence', icon: Zap },
  { name: 'Decisions', href: '/dashboard/decisions', icon: Scale },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];


function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-hide" aria-label="Main navigation">
      {navigation.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'sidebar-item group',
              isActive && 'sidebar-item-active'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{item.name}</span>
            {isActive && (
              <ChevronRight
                className="ml-auto h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-40 flex h-8 w-8 items-center justify-center rounded-lg bg-nexora-surface border border-border text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-nexora-surface border-r border-border transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <span className="font-bold text-base text-foreground tracking-tight">
                  NEXORA
                </span>
                <p className="text-[10px] text-muted-foreground -mt-0.5 leading-none">
                  Org OS
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <NavLinks onNavigate={() => setSidebarOpen(false)} />

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">
                  NEXORA v0.1.0
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Autonomous Organization OS
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}