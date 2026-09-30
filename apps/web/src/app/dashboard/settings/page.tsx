'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAccountContext, useOrganizationContext } from '@/lib/organizationContext';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';

export default function SettingsPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAccountContext();
  const activeCompany = useOrganizationContext();
  const previewMode = isDevelopmentAuthBypassEnabled();

  function signOut() {
    logout();
    router.replace('/auth/login');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Account</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review the signed-in identity and organization context used by this workspace.</p>
      </header>

      <section className="glass rounded-2xl p-5 sm:p-6" aria-labelledby="profile-heading">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 id="profile-heading" className="font-semibold text-foreground">Signed-in profile</h2><p className="text-xs text-muted-foreground">Profile information managed by your NEXORA account.</p></div>
        </div>
        {user ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <SettingValue label="Name" value={`${user.first_name} ${user.last_name}`.trim() || user.username} />
            <SettingValue label="Username" value={user.username} />
            <SettingValue label="Email" value={user.email} />
            <SettingValue label="Account status" value={user.is_active ? 'Active' : 'Inactive'} />
          </dl>
        ) : <p className="text-sm text-muted-foreground">Your profile has not been loaded.</p>}
      </section>

      <section className="glass rounded-2xl p-5 sm:p-6" aria-labelledby="organization-heading">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 id="organization-heading" className="font-semibold text-foreground">Active organization</h2><p className="text-xs text-muted-foreground">Workspace context for organization data and actions.</p></div>
        </div>
        {activeCompany ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <SettingValue label="Organization" value={activeCompany.name} />
            <SettingValue label="Industry" value={activeCompany.industry || 'Not set'} />
            <SettingValue label="Status" value={activeCompany.status} />
            <SettingValue label="Mission" value={activeCompany.mission || 'Not set'} />
          </dl>
        ) : <p className="text-sm text-muted-foreground">No organization is selected. Select or create one from the Organizations page.</p>}
        <Link className="mt-5 inline-flex text-sm font-medium text-primary hover:underline" href="/dashboard/organizations">Manage organizations</Link>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6" aria-labelledby="session-heading">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 id="session-heading" className="font-semibold text-foreground">Session</h2><p className="text-xs text-muted-foreground">This signs you out of NEXORA in this browser.</p></div>
        </div>
        <button type="button" className="btn btn-outline gap-2" onClick={signOut} disabled={previewMode} title={previewMode ? 'Sign-out is unavailable in synthetic preview mode' : undefined}><LogOut className="h-4 w-4" aria-hidden="true" />{previewMode ? 'Sign out unavailable in preview' : 'Sign out'}</button>
      </section>
    </div>
  );
}

function SettingValue({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm text-foreground">{value}</dd></div>;
}
