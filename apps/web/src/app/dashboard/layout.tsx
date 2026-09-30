'use client';

import { Sidebar } from './Sidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuthStore } from '@/store/auth';
import { organizationsApi } from '@/lib/api/organizations';
import { Building2, ChevronDown, Eye, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeCompany, setActiveCompany, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const developmentBypass = isDevelopmentAuthBypassEnabled();
  const pathname = usePathname();
  const pageLabel = pathname === '/dashboard' ? 'COMMAND CENTER' : pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').toUpperCase() ?? 'WORKSPACE';

  useEffect(() => {
    // If no active company is loaded, automatically fetch and select the default company
    if (!activeCompany && !developmentBypass) {
      organizationsApi.list().then((companies) => {
        if (companies && companies.length > 0) {
          setActiveCompany(companies[0]);
        }
      }).catch(() => {});
    }
  }, [activeCompany, developmentBypass, setActiveCompany]);

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
      <div className="dashboard-atmosphere min-h-screen bg-nexora-dark">
        <Sidebar />

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="nexora-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 pl-16 backdrop-blur-lg lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-[10px] font-mono tracking-[.15em]">
              <span className="text-muted-foreground/60">NEXORA / ORGANIZATION OS</span>
              <span className="text-primary/55">/</span>
              <span className="truncate text-foreground/70">{pageLabel}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Active company */}
              {activeCompany && !developmentBypass && (
                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {activeCompany.name}
                  </span>
                </div>
              )}

              {/* User menu */}
              {developmentBypass ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> UI preview
                </div>
              ) : <div className="relative">
                <button
                  id="user-menu-trigger"
                  type="button"
                  className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-1.5 hover:bg-secondary/80 transition-colors"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {initials}
                  </div>
                  {user && (
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground leading-none">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </button>

                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-nexora-surface shadow-lg ring-1 ring-border">
                      <div className="p-1">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                          onClick={() => { setShowUserMenu(false); }}
                        >
                          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Profile
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          id="logout-button"
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>}
            </div>
          </header>

          {/* Page content */}
          <main className="dashboard-canvas p-4 lg:p-6" role="main">
            {developmentBypass && <div className="mb-5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/90" role="status">Synthetic preview data · all dashboard pages show local sample records, not live data. Preview is read-only; writes are blocked and no API requests are sent.</div>}
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
