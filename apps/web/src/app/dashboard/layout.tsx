'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Activity,
  Zap,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Workflows', href: '/workflows', icon: GitBranch },
  { name: 'Councils', href: '/councils', icon: Users },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Governance', href: '/governance', icon: Shield },
  { name: 'Resources', href: '/resources', icon: Database },
  { name: 'Blueprints', href: '/blueprints', icon: FileText },
  { name: 'Intelligence', href: '/intelligence', icon: Zap },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '/dashboard';

  return (
    <div className="min-h-screen bg-nexora-dark">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-nexora-surface border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg text-foreground">NEXORA</span>
            </Link>
            <button
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">
                NEXORA v0.1.0 — Autonomous Organization OS
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 border-b border-border bg-nexora-surface/80 backdrop-blur-lg lg:px-6">
          <button
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Organization selector */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">Nexora Corp</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>

            {/* User menu placeholder */}
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-sm font-medium text-primary-foreground">A</span>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">Alice Smith</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}