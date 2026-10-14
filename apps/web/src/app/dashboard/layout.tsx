'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { ThemeToggle } from '@/components/ThemeToggle';
import { isTauriDesktop, desktopEvents, desktopWindowState } from '@/lib/desktop/tauriBridge';
import { SystemSetupWizard } from '@/components/layout/SystemSetupWizard';
import { UpdateReadyModal } from '@/components/layout/UpdateReadyModal';
import { AgentOrb } from '@/components/ui/AgentOrb';
import { SystemResourcePill } from '@/components/layout/SystemResourcePill';
import { CockpitDrawer } from '@/components/layout/CockpitDrawer';
import { ResourceCockpitView } from '@/components/layout/ResourceCockpitView';
import { CockpitFooterDock } from '@/components/layout/CockpitFooterDock';
import { HeaderOperationalBar } from '@/components/layout/HeaderOperationalBar';
import { UnifiedCockpitDrawerHub } from '@/components/layout/UnifiedCockpitDrawerHub';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeCompany, setActiveCompany, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const developmentBypass = isDevelopmentAuthBypassEnabled();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active drawer synchronized with URL ?drawer=
  const activeDrawerId = searchParams.get('drawer');

  const handleOpenDrawer = (drawerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('drawer', drawerId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('drawer');
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
  };

  // Compute breadcrumbs path
  const segments = pathname.split('/').filter(Boolean);
  const currentDomain = segments.length > 1 ? segments[1].replace(/-/g, ' ') : 'Overview';

  const [setupWizardOpen, setSetupWizardOpen] = useState(false);

  useEffect(() => {
    // Validate activeCompany against available backend organizations
    organizationsApi
      .list()
      .then((companies) => {
        if (companies && companies.length > 0) {
          const exists = activeCompany && companies.some((c) => c.id === activeCompany.id);
          if (!exists) {
            setActiveCompany(companies[0]);
          }
        } else {
          setSetupWizardOpen(true);
        }
      })
      .catch(() => {
        if (!activeCompany) {
          setSetupWizardOpen(true);
        }
      });
  }, [activeCompany, setActiveCompany]);

  // Global keyboard shortcuts for Command Palette (Cmd/Ctrl+K) and Quick Domain Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT');

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Alt+1..6: Topbar Operational items
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const topbarMap: Record<string, string> = {
          '1': '/dashboard/agents',
          '2': '/dashboard/councils',
          '3': '/dashboard/workflows',
          '4': '/dashboard/projects',
          '5': '/dashboard/tasks',
          '6': '/dashboard/approvals',
        };
        if (topbarMap[e.key]) {
          e.preventDefault();
          window.location.href = topbarMap[e.key];
          return;
        }
      }

      // Quick numbers 1-6 when NOT typing in an input
      if (!isInput && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const singleKeyMap: Record<string, string> = {
          '1': '/dashboard/agents',
          '2': '/dashboard/councils',
          '3': '/dashboard/workflows',
          '4': '/dashboard/projects',
          '5': '/dashboard/tasks',
          '6': '/dashboard/approvals',
          '0': '/dashboard',
        };
        if (singleKeyMap[e.key]) {
          e.preventDefault();
          window.location.href = singleKeyMap[e.key];
          return;
        }
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
        {/* Main Application Workspace (Full-Width, Zero Sidebar) */}
        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          {/* Top bar with Breadcrumbs, Global Search, ThemeToggle, & User Menu */}
          <header className="NEIMAN-topbar sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between border-b border-border/80 px-4 backdrop-blur-xl lg:px-6 gap-3 flex-wrap py-2">
            {/* Left: Domain Breadcrumbs & Live AI Thinking Beacon */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
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

              {/* Cognitive Status Orb Indicator */}
              <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-border/40 font-mono text-[10px] text-muted-foreground">
                <AgentOrb status="ACTIVE" size={20} />
                <span className="uppercase tracking-widest text-[#EDEDED]">COGNITION: ACTIVE</span>
              </div>

              {/* High-Frequency Operational Action Bar */}
              <HeaderOperationalBar
                onOpenDrawer={handleOpenDrawer}
                activeDrawerId={activeDrawerId}
              />
            </div>

            {/* Right: Telemetry Pill, Global Search, Theme Toggle, Organization Switcher, Notifications, User Menu */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {/* Persistent Live System Resource Telemetry Pill */}
              <SystemResourcePill onOpenDrawer={() => setResourceDrawerOpen(true)} />

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
              <OrganizationSwitcher />

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
          <main id="main-content" className="dashboard-canvas flex-1 overflow-y-auto p-4 lg:p-6 pb-20" role="main">
            {children}
          </main>

          {/* Persistent Bottom Cockpit Dock Navigation */}
          <CockpitFooterDock
            onOpenDrawer={handleOpenDrawer}
            activeDrawerId={activeDrawerId}
          />
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

        {/* Global Cockpit Slide-Over Drawer for Live Resources */}
        <CockpitDrawer
          isOpen={resourceDrawerOpen}
          onClose={() => setResourceDrawerOpen(false)}
          title="Operational Resource Control"
          subtitle="Compute, CGroup Isolation, Token Quotas & Budgets"
        >
          <ResourceCockpitView />
        </CockpitDrawer>

        {/* Unified Cockpit Slide-Over Drawer Hub (Workforce, Workflows, Simulation, Memory, etc.) */}
        <UnifiedCockpitDrawerHub
          activeDrawerId={activeDrawerId}
          onClose={handleCloseDrawer}
        />
      </div>
    </AuthGuard>
  );
}
