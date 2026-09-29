'use client';

import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Building2, ChevronRight } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-nexora-dark">
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 border-b border-border bg-nexora-surface/80 backdrop-blur-lg lg:px-6">
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