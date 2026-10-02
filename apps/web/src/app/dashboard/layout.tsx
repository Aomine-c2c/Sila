'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  Eye,
  LogOut,
  User,
  Search,
  Command,
  ChevronRight,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuthStore } from '@/store/auth';
import { organizationsApi } from '@/lib/api/organizations';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { OrganizationSwitcher } from '@/components/layout/OrganizationSwitcher';
import { NotificationsCenter } from '@/components/layout/NotificationsCenter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeCompany, setActiveCompany, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const developmentBypass = isDevelopmentAuthBypassEnabled();
  const pathname = usePathname();

  // Compute breadcrumbs path
  const segments = pathname.split('/').filter(Boolean);
  const currentDomain = segments.length > 1 ? segments[1].replace(/-/g, ' ') : 'Overview';

  useEffect(() => {
    // If no active company is loaded, automatically fetch and select the default company
    if (!activeCompany && !developmentBypass) {
      organizationsApi
        .list()
        .then((companies) => {
          if (companies && companies.length > 0) {
            setActiveCompany(companies[0]);
          }
        })
        .catch(() => {});
    }
  }, [activeCompany, developmentBypass, setActiveCompany]);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/auth/login';
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
      user.username[0].toUpperCase()
    : 'U';

  return (
    <AuthGuard>
      <div className="dashboard-atmosphere min-h-screen bg-nexora-dark w-full">
        {/* Top bar with HeaderCommandStrip & Multi-State Organic Activity Orb */}
        <header className="nexora-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 backdrop-blur-lg lg:px-6 gap-4">
          {/* Left: Brand & Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <Link
                href="/dashboard"
                className="text-muted-foreground/80 hover:text-foreground transition-colors font-bold text-sm tracking-tight flex items-center gap-2"
                title="Return to Core Orbital Constellation"
              >
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                NEXORA
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <Link
                href="/dashboard"
                className="text-primary font-semibold uppercase tracking-wider truncate text-xs hover:underline"
              >
                {currentDomain}
              </Link>
            </div>
          </div>

          {/* Right: Global Search, Organization Switcher, Notifications, User Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Global Search trigger button */}
            <div className="hidden xl:flex items-center w-48">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary/70 hover:text-foreground transition-all"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label="Open command palette"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Search...</span>
                </div>
                <kbd className="inline-flex items-center gap-0.5 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground ring-1 ring-border">
                  <Command className="h-2.5 w-2.5" /> K
                </kbd>
              </button>
            </div>

            {/* Organization Switcher */}
            {!developmentBypass ? (
              <OrganizationSwitcher />
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
                <Eye className="h-3 w-3" aria-hidden="true" /> UI preview
              </div>
            )}

            {/* Notifications & Approvals */}
            <NotificationsCenter />

              {/* User menu */}
              <div className="relative">
                <button
                  id="user-menu-trigger"
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-secondary/50 p-1 sm:px-2.5 sm:py-1.5 hover:bg-secondary/80 transition-colors"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {initials}
                  </div>
                  {user && (
                    <div className="hidden lg:block text-left max-w-[120px]">
                      <p className="text-xs font-medium text-foreground truncate leading-none">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-nexora-surface shadow-xl ring-1 ring-border p-1 animate-fade-in">
                      <div className="px-3 py-2 border-b border-border/60">
                        <p className="text-xs font-semibold text-foreground">
                          {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-secondary/60 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        Account & Profile
                      </Link>
                      <hr className="my-1 border-border/60" />
                      <button
                        id="logout-button"
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page main content */}
          <main className="dashboard-canvas p-4 lg:p-6" role="main">
            {developmentBypass && (
              <div
                className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/90"
                role="status"
              >
                Synthetic preview data · all dashboard pages show local sample records, not live data. Preview is read-only; writes are blocked and no API requests are sent.
              </div>
            )}
            {children}
          </main>

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />
      </div>
    </AuthGuard>
  );
}
