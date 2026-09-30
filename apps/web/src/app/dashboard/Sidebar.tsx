'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Bot, GitBranch, Brain, Database, Shield, FileText,
  Settings, Menu, X, ChevronRight, Building2, Zap, Scale, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const groups = [
  { label: 'OPERATE', items: [
    { name: 'Control room', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Agents', href: '/dashboard/agents', icon: Bot },
    { name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch },
    { name: 'Councils', href: '/dashboard/councils', icon: Users },
  ] },
  { label: 'INTELLIGENCE', items: [
    { name: 'Provider mesh', href: '/dashboard/intelligence', icon: Zap },
    { name: 'Org memory', href: '/dashboard/memory', icon: Brain },
    { name: 'Evolution lab', href: '/dashboard/evolution', icon: Sparkles },
  ] },
  { label: 'GOVERN', items: [
    { name: 'Decisions', href: '/dashboard/decisions', icon: Scale },
    { name: 'Governance', href: '/dashboard/governance', icon: Shield },
    { name: 'Resources', href: '/dashboard/resources', icon: Database },
    { name: 'Blueprints', href: '/dashboard/blueprints', icon: FileText },
  ] },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-hide" aria-label="Main navigation">
      {groups.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.2em] text-muted-foreground/65">{group.label}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === '/dashboard' ? pathname === item.href : pathname?.startsWith(item.href);
              return <Link key={item.name} href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                className={cn('sidebar-item group h-10 rounded-lg px-3 text-[13px]', active && 'sidebar-item-active')}>
                <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} aria-hidden="true" />
                <span className="flex-1 truncate">{item.name}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
              </Link>;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <>
    <button type="button" className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-nexora-surface text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
    {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
    <aside className={cn('nexora-sidebar fixed left-0 top-0 z-50 h-screen w-[252px] border-r border-border transition-transform duration-300 ease-in-out', sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')} aria-label="Main navigation">
      <div className="flex h-full flex-col">
        <div className="flex h-[76px] items-center justify-between border-b border-border/80 px-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="nexora-mark relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-mono text-base font-black tracking-tighter">N</span>
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-nexora-surface bg-primary" />
            </div>
            <div><span className="block text-[14px] font-bold tracking-[0.14em] text-foreground">NEXORA</span><span className="block text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Organization OS</span></div>
          </Link>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X className="h-4 w-4" /></button>
        </div>
        <NavLinks onNavigate={() => setSidebarOpen(false)} />
        <div className="border-t border-border/80 p-4">
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl border border-border/80 bg-background/60 p-3 transition-colors hover:border-primary/30">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><Settings className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-xs font-medium text-foreground">Workspace settings</p><p className="mt-0.5 text-[10px] text-muted-foreground">Policies · people · access</p></div>
          </Link>
          <p className="mt-3 px-1 font-mono text-[9px] tracking-wide text-muted-foreground/45">NEXORA / EARLY ACCESS</p>
        </div>
      </div>
    </aside>
  </>;
}
