'use client';

import { Sidebar } from './Sidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuthStore } from '@/store/auth';
import { organizationsApi } from '@/lib/api/organizations';
import { Building2, ChevronDown, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeCompany, setActiveCompany, setUser, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // If no active company is loaded, automatically fetch and select the default company
    if (!activeCompany) {
      organizationsApi.list().then((companies) => {
        if (companies && companies.length > 0) {
          setActiveCompany(companies[0]);
        }
      }).catch(() => {});
    }
    // Default user display if not yet set
    if (!user) {
      setUser({
        id: '9427e8aa-5d77-4be6-9db3-cca1dbf68b19',
        email: 'admin@furnitureco.com',
        username: 'admin_furniture',
        first_name: 'Admin',
        last_name: 'Furniture',
        is_active: true,
        is_superuser: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }, [activeCompany, user, setActiveCompany, setUser]);

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
      <div className="min-h-screen bg-nexora-dark">
        <Sidebar />

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 border-b border-border bg-nexora-surface/80 backdrop-blur-lg lg:px-6">
            <div className="flex-1" />

            <div className="flex items-center gap-4">
              {/* Active company */}
              {activeCompany && (
                <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {activeCompany.name}
                  </span>
                </div>
              )}

              {/* User menu */}
              <div className="relative">
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
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6" role="main">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}