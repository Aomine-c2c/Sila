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
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { isTauriDesktop, desktopEvents, desktopWindowState } from '@/lib/desktop/tauriBridge';
import { SystemSetupWizard } from '@/components/layout/SystemSetupWizard';
import { UpdateReadyModal } from '@/components/layout/UpdateReadyModal';

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

  const [setupWizardOpen, setSetupWizardOpen] = useState(false);

  useEffect(() => {
    // If no active company is loaded, check if any companies exist; if none, show setup wizard
    if (!activeCompany && !developmentBypass) {
      organizationsApi
        .list()
        .then((companies) => {
          if (companies && companies.length > 0) {
            setActiveCompany(companies[0]);
          } else {
            setSetupWizardOpen(true);
          }
        })
        .catch(() => {
          // If network / API empty, prompt wizard
          setSetupWizardOpen(true);
        });
    }
  }, [activeCompany, developmentBypass, setActiveCompany]);

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K) and Desktop Native integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Deep link handler (e.g. neiman://dashboard/simulation or neiman://dashboard/activity)
    let unlistenDeepLink: (() => void) | undefined;
    if (isTauriDesktop()) {
      desktopEvents.listenDeepLink((url) => {
        try {
          const parsed = new URL(url);
          const targetPath = parsed.pathname || parsed.host;
          if (targetPath) {
            window.location.href = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
          }
        } catch {
          // fallback string replace
          const cleanPath = url.replace(/^neiman:\/\//, '/');
          window.location.href = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        }
      }).then((unsub) => {
        unlistenDeepLink = unsub;
      });

      // Window resize / position persistence
      const handleResizeOrMove = () => {
        desktopWindowState.save({
          width: window.innerWidth,
          height: window.innerHeight,
          x: window.screenX,
          y: window.screenY,
          is_maximized: window.outerWidth >= window.screen.availWidth && window.outerHeight >= window.screen.availHeight,
        });
      };
      window.addEventListener('resize', handleResizeOrMove);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResizeOrMove);
        if (unlistenDeepLink) unlistenDeepLink();
      };
    }

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
      <div className="dashboard-atmosphere flex h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Left Minimalist Sidebar */}
        <Sidebar />

        {/* Right Main Application Workspace */}
        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          {/* Top bar with Breadcrumbs, Global Search, ThemeToggle, & User Menu */}
          <header className="NEIMAN-topbar sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-4 backdrop-blur-xl lg:px-6 gap-4">
            {/* Left: Domain Breadcrumbs */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors font-bold text-xs tracking-widest flex items-center gap-2 uppercase"
                  title="Return to Core Overview"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D71921] shadow-[0_0_6px_#D71921]" />
                  SYS
                </Link>
                <span className="text-muted-foreground/40 font-mono">/</span>
                <span className="text-foreground font-semibold uppercase tracking-widest truncate text-xs font-mono">
                  {currentDomain}
                </span>
              </div>
            </div>

            {/* Right: Global Search, Theme Toggle, Organization Switcher, Notifications, User Menu */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Global Search trigger button */}
              <div className="hidden md:flex items-center w-44 lg:w-56">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded border border-border bg-secondary/30 px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:border-foreground/30 hover:bg-secondary/70 hover:text-foreground transition-all duration-150"
                  onClick={() => setCommandPaletteOpen(true)}
                  aria-label="Open command palette"
                >
                  <div className="flex items-center gap-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] uppercase tracking-wider">Search...</span>
                  </div>
                  <kbd className="inline-flex items-center gap-0.5 rounded-sm bg-secondary px-1 py-0.5 text-[9px] font-mono text-muted-foreground border border-border">
                    <Command className="h-2 w-2" /> K
                  </kbd>
                </button>
              </div>

              {/* Theme Toggle (Light / Dark) */}
              <ThemeToggle />

              {/* Organization Switcher */}
              {!developmentBypass ? (
                <OrganizationSwitcher />
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded border border-[#D71921]/30 bg-[#D71921]/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#D71921]">
                  <Eye className="h-3 w-3" aria-hidden="true" /> PREVIEW
                </div>
              )}

              {/* Notifications & Approvals */}
              <NotificationsCenter />

              {/* User menu */}
              <div className="relative">
                <button
                  id="user-menu-trigger"
                  type="button"
                  className="flex items-center gap-2 rounded border border-border p-1 sm:px-2 sm:py-1 hover:bg-secondary hover:border-foreground/30 transition-colors font-mono"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User account menu"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#D71921] text-[10px] font-mono font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  {user && (
                    <div className="hidden lg:block text-left max-w-[120px]">
                      <p className="text-[11px] font-mono font-medium text-foreground truncate leading-none uppercase">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border bg-card shadow-xl ring-1 ring-border p-1 animate-fade-in">
                      <div className="px-3 py-2 border-b border-border/60">
                        <p className="text-xs font-semibold text-foreground">
                          {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User'}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        Account & Profile
                      </Link>
                      <hr className="my-1 border-border/60" />
                      <button
                        id="logout-button"
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
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
          <main id="main-content" className="dashboard-canvas flex-1 overflow-y-auto p-4 lg:p-6" role="main">
            {developmentBypass && (
              <div
                className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-200/90"
                role="status"
              >
                Synthetic preview data · all dashboard pages show local sample records, not live data. Preview is read-only; writes are blocked and no API requests are sent.
              </div>
            )}
            {children}
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* First-Time Setup & Onboarding Wizard */}
        <SystemSetupWizard
          isOpen={setupWizardOpen}
          onClose={() => setSetupWizardOpen(false)}
          onCompleted={() => setSetupWizardOpen(false)}
        />

        {/* Native Auto-Update Prompt (Silent background download -> restart prompt) */}
        <UpdateReadyModal />
      </div>
    </AuthGuard>
  );
}
