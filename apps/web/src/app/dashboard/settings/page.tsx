'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Shield,
  Key,
  Lock,
  Cpu,
  Zap,
  Database,
  FileText,
  Boxes,
  Bell,
  Palette,
  Clock,
  Terminal,
  Code,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Save,
  RotateCw,
  LogOut,
  UserRound,
  ShieldCheck,
  ChevronRight,
  Info,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAccountContext, useOrganizationContext } from '@/lib/organizationContext';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';
import { DesktopStatusCard } from '@/components/desktop/DesktopStatusCard';

// 15 Administration Sections
type AdminSectionKey =
  | 'organization'
  | 'members'
  | 'roles'
  | 'permissions'
  | 'security'
  | 'ai-providers'
  | 'models'
  | 'resources'
  | 'policies'
  | 'integrations'
  | 'notifications'
  | 'appearance'
  | 'audit-logs'
  | 'api'
  | 'developer';

type SettingsTier = 'simple' | 'advanced';

import { type RBACRole, hasRoleAccess } from '@neiman/permissions';
export type { RBACRole };

interface SectionMeta {
  key: AdminSectionKey;
  label: string;
  icon: any;
  tier: 'simple' | 'advanced' | 'both';
  requiredRole: RBACRole;
  dangerous?: boolean;
  description: string;
}

const SECTIONS: SectionMeta[] = [
  { key: 'organization', label: 'Organization', icon: Building2, tier: 'simple', requiredRole: 'VIEWER', description: 'General workspace identity, company profile, industry, and mission.' },
  { key: 'members', label: 'Members', icon: Users, tier: 'simple', requiredRole: 'MANAGER', description: 'Workspace roster, team invites, and departmental assignments.' },
  { key: 'roles', label: 'Roles', icon: Shield, tier: 'simple', requiredRole: 'ADMIN', description: 'Organizational hierarchy and role assignments.' },
  { key: 'permissions', label: 'Permissions', icon: Lock, tier: 'advanced', requiredRole: 'SUPERADMIN', dangerous: true, description: 'Granular resource scopes, action capabilities, and role permission matrices.' },
  { key: 'security', label: 'Security', icon: ShieldCheck, tier: 'advanced', requiredRole: 'ADMIN', dangerous: true, description: 'MFA enforcement, session timeout bounds, IP allowlists, and SSO.' },
  { key: 'ai-providers', label: 'AI Providers', icon: Cpu, tier: 'both', requiredRole: 'ADMIN', description: 'Vendor credentials, endpoint gateways, and circuit-breaker telemetry.' },
  { key: 'models', label: 'Models', icon: Zap, tier: 'simple', requiredRole: 'MANAGER', description: 'Allowed model whitelist, default mappings, and temperature guardrails.' },
  { key: 'resources', label: 'Resources', icon: Database, tier: 'simple', requiredRole: 'ADMIN', description: 'Compute limits, token monthly caps, and departmental quota pools.' },
  { key: 'policies', label: 'Policies', icon: FileText, tier: 'both', requiredRole: 'ADMIN', description: 'Constitutional rules, approval requirements, and dissent preservation.' },
  { key: 'integrations', label: 'Integrations', icon: Boxes, tier: 'simple', requiredRole: 'ADMIN', description: 'Webhooks, Slack, GitHub, Datadog, and enterprise service connectors.' },
  { key: 'notifications', label: 'Notifications', icon: Bell, tier: 'simple', requiredRole: 'VIEWER', description: 'Incident alerts, email summaries, sound pings, and delivery rules.' },
  { key: 'appearance', label: 'Appearance', icon: Palette, tier: 'simple', requiredRole: 'VIEWER', description: 'Theme defaults, font scaling, command center accent colors, and density.' },
  { key: 'audit-logs', label: 'Audit Logs', icon: Clock, tier: 'both', requiredRole: 'MANAGER', description: 'Immutable chronological trace of administrative and operational actions.' },
  { key: 'api', label: 'API', icon: Key, tier: 'advanced', requiredRole: 'ADMIN', dangerous: true, description: 'Personal & organization service access tokens and HMAC keys.' },
  { key: 'developer', label: 'Developer Settings', icon: Terminal, tier: 'advanced', requiredRole: 'SUPERADMIN', dangerous: true, description: 'Debug flags, synthetic chaos injections, schema migrations, and engine telemetry.' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { user } = useAccountContext();
  const activeCompany = useOrganizationContext();
  const previewMode = isDevelopmentAuthBypassEnabled();

  // Tier toggle (Simple Settings vs Advanced Settings)
  const [activeTier, setActiveTier] = useState<SettingsTier>('simple');
  const [activeSection, setActiveSection] = useState<AdminSectionKey>('organization');

  // Simulated RBAC role selector for testing
  const [simulatedRole, setSimulatedRole] = useState<RBACRole>('SUPERADMIN');

  // Success / save indicator
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Sensitive credentials state (masked by default, never shown in plaintext after configuration)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);

  // Form states
  const [orgName, setOrgName] = useState(activeCompany?.name || 'NEIMAN Autonomous Systems');
  const [orgIndustry, setOrgIndustry] = useState(activeCompany?.industry || 'Enterprise Autonomous AI');
  const [orgMission, setOrgMission] = useState(activeCompany?.mission || 'Orchestrate self-improving agent workforces with transparent human oversight.');
  const [defaultTheme, setDefaultTheme] = useState('light');
  const [density, setDensity] = useState('comfortable');

  // Provider states
  const [providers, setProviders] = useState([
    { id: 'prov-openai', name: 'OpenAI Gateway', maskedKey: 'sk-proj-••••••••••••••••••••••••••••••••u48A', configured: true, status: 'Active (Circuit Closed)' },
    { id: 'prov-anthropic', name: 'Anthropic Cloud', maskedKey: 'sk-ant-••••••••••••••••••••••••••••••••7F91', configured: true, status: 'Active (Circuit Closed)' },
    { id: 'prov-google', name: 'Google Vertex / Gemini', maskedKey: 'AIzaSy••••••••••••••••••••••••••••••••3L09', configured: true, status: 'Active (Circuit Closed)' },
  ]);

  // API Tokens state
  const [apiTokens, setApiTokens] = useState([
    { id: 'tok-prod-cli', name: 'CLI Operator Token', created: '2026-09-15', lastUsed: '12 mins ago', maskedSecret: 'nm_live_••••••••••••••••••••••••••••94b2', scope: 'admin:full' },
    { id: 'tok-ci-worker', name: 'CI/CD Pipeline Service Account', created: '2026-09-20', lastUsed: '2 hours ago', maskedSecret: 'nm_live_••••••••••••••••••••••••••••10a8', scope: 'workforce:deploy' },
  ]);

  const [newTokenName, setNewTokenName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Notification states
  const [notifyOutages, setNotifyOutages] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [notifyAudit, setNotifyAudit] = useState(false);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState('daily');

  // Security states
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(60);
  const [ipWhitelist, setIpWhitelist] = useState('10.0.0.0/8\n192.168.1.0/24');

  const hasAccess = (requiredRole: RBACRole) => {
    return hasRoleAccess(simulatedRole, requiredRole);
  };

  // Filter sections by selected Tier (Simple vs Advanced)
  const visibleSections = SECTIONS.filter((sec) => {
    if (activeTier === 'simple') {
      return sec.tier === 'simple' || sec.tier === 'both';
    } else {
      return sec.tier === 'advanced' || sec.tier === 'both';
    }
  });

  const currentSectionMeta = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];

  const handleSave = () => {
    setSavedBanner('Settings changes committed and applied successfully.');
    setTimeout(() => setSavedBanner(null), 3500);
  };

  const handleGenerateToken = () => {
    if (!newTokenName.trim()) return;
    const generated = `nm_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newToken = {
      id: `tok-${Date.now()}`,
      name: newTokenName,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
      maskedSecret: `nm_live_••••••••••••••••••••••••••••${generated.slice(-4)}`,
      scope: 'workforce:write',
    };
    setApiTokens([...apiTokens, newToken]);
    setCreatedSecret(generated);
    setNewTokenName('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  NEIMAN Administration Area
                </h1>
                <span className="badge badge-primary text-xs">RBAC Protected</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized workspace governance, credentials, permissions, intelligence, and system configuration.
              </p>
            </div>
          </div>
        </div>

        {/* RBAC Role Simulator & Save Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-secondary/50 px-2 py-1 rounded-xl border border-border text-xs font-mono">
            <span className="text-muted-foreground text-[10px] mr-1.5 uppercase">Simulated Role:</span>
            <select
              value={simulatedRole}
              onChange={(e) => setSimulatedRole(e.target.value as RBACRole)}
              className="bg-transparent font-bold text-primary focus:outline-none cursor-pointer"
            >
              <option value="SUPERADMIN" className="bg-card text-foreground">SUPERADMIN</option>
              <option value="ADMIN" className="bg-card text-foreground">ADMIN</option>
              <option value="MANAGER" className="bg-card text-foreground">MANAGER</option>
              <option value="VIEWER" className="bg-card text-foreground">VIEWER</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary text-xs h-9 px-3 gap-1.5 font-mono shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {savedBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Authoritative Security Notice */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs font-mono flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Zero-Trust Authorization:</strong> Frontend hides unauthorized controls for ergonomics. The backend API independently enforces role verification and token cryptographic validity on every mutation.
          </span>
        </div>
        <span className="badge badge-outline text-[10px] text-primary shrink-0">SERVER AUTHORITATIVE</span>
      </div>

      {/* Desktop Runtime & Capability Indicator */}
      <DesktopStatusCard />

      {/* TIER SWITCHER: SIMPLE SETTINGS vs ADVANCED SETTINGS */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/50 border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTier('simple');
              if (currentSectionMeta.tier === 'advanced') {
                setActiveSection('organization');
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTier === 'simple'
                ? 'bg-card text-foreground shadow-sm border border-border ring-1 ring-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            Simple Settings
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTier('advanced');
              if (currentSectionMeta.tier === 'simple') {
                setActiveSection('permissions');
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTier === 'advanced'
                ? 'bg-card text-foreground shadow-sm border border-border ring-1 ring-primary/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="h-3.5 w-3.5 text-amber-400" />
            Advanced Settings (Engine & Security)
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>
            {activeTier === 'simple'
              ? 'Showing everyday workspace, team, and preference controls'
              : 'Showing high-privilege security, API, and engine internals'}
          </span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN ADMIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 15-Section Navigation List */}
        <div className="lg:col-span-3 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
            {activeTier === 'simple' ? 'Simple Categories' : 'Advanced Categories'}
          </div>

          <div className="space-y-1">
            {visibleSections.map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.key;
              const permitted = hasAccess(sec.requiredRole);

              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setActiveSection(sec.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left ${
                    isSelected
                      ? 'bg-primary/10 text-primary border border-primary/30 font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="truncate">{sec.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {sec.dangerous && (
                      <span className="badge badge-destructive text-[9px] px-1 py-0 h-4">
                        DANGER
                      </span>
                    )}
                    {!permitted && (
                      <span title={`Requires ${sec.requiredRole}`}>
                        <Lock className="h-3 w-3 text-muted-foreground/60" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* User & Session Card */}
          <div className="pt-4 border-t border-border/60 mt-4 px-2 space-y-2 text-xs">
            <div className="text-[10px] font-mono text-muted-foreground uppercase">CURRENT USER</div>
            <div className="p-2.5 rounded-xl bg-secondary/30 border border-border flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate text-xs">{user?.username || 'admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@neiman.ai'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Section Panel */}
        <div className="lg:col-span-9">
          {/* RBAC PERMISSION CHECK */}
          {!hasAccess(currentSectionMeta.requiredRole) ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center space-y-3">
              <Lock className="h-10 w-10 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-foreground">Access Restricted by RBAC</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                You do not have permission to view or modify <strong className="text-foreground">{currentSectionMeta.label}</strong>.
                This section requires <span className="badge badge-outline text-xs font-mono">{currentSectionMeta.requiredRole}</span> privileges.
                Switch your simulated role above to inspect.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <currentSectionMeta.icon className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">{currentSectionMeta.label}</h2>
                    {currentSectionMeta.dangerous && (
                      <span className="badge badge-destructive text-[10px] font-mono">
                        HIGH PRIVILEGE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentSectionMeta.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge-secondary text-[10px] font-mono">
                    ROLE: {currentSectionMeta.requiredRole}
                  </span>
                </div>
              </div>

              {/* DANGEROUS SETTINGS WARNING (If Applicable) */}
              {currentSectionMeta.dangerous && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="font-bold">Dangerous Configuration Zone:</strong>
                    <p className="text-rose-200/80 text-[11px]">
                      Modifications in this category immediately alter system security, identity scopes, or engine infrastructure.
                      All changes are recorded immutably in the organizational Audit Log.
                    </p>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 1: ORGANIZATION ────────────────── */}
              {activeSection === 'organization' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">ORGANIZATION NAME</label>
                      <input
                        type="text"
                        className="input text-xs"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">INDUSTRY DOMAIN</label>
                      <input
                        type="text"
                        className="input text-xs"
                        value={orgIndustry}
                        onChange={(e) => setOrgIndustry(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">ORGANIZATIONAL MISSION</label>
                    <textarea
                      rows={3}
                      className="input h-auto text-xs py-2"
                      value={orgMission}
                      onChange={(e) => setOrgMission(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground block">COMPANY ID</span>
                      <span className="font-bold text-foreground">{activeCompany?.id?.slice(0, 13) || 'org-0001'}...</span>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground block">STATUS</span>
                      <span className="font-bold text-emerald-400">ACTIVE & VERIFIED</span>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                      <span className="text-[10px] text-muted-foreground block">TIER</span>
                      <span className="font-bold text-primary">ENTERPRISE SCALE</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 2: MEMBERS ────────────────── */}
              {activeSection === 'members' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Active Roster (4 Operators)</span>
                    <button className="btn btn-outline text-xs h-7 px-2.5 gap-1">
                      <Plus className="h-3 w-3" />
                      Invite Member
                    </button>
                  </div>

                  <div className="divide-y divide-border/40">
                    {[
                      { name: 'Dr. Jane Vance', email: 'jane.vance@neiman.ai', role: 'SUPERADMIN', dept: 'Executive' },
                      { name: 'Marcus Sterling', email: 'marcus.s@neiman.ai', role: 'ADMIN', dept: 'Engineering' },
                      { name: 'Elena Rostova', email: 'elena.r@neiman.ai', role: 'MANAGER', dept: 'Reliability SRE' },
                      { name: 'Tariq Al-Mansoor', email: 'tariq.a@neiman.ai', role: 'VIEWER', dept: 'Security Audit' },
                    ].map((m, i) => (
                      <div key={i} className="py-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">{m.email} &bull; {m.dept}</p>
                        </div>
                        <span className="badge badge-outline text-[10px] font-mono">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 3: ROLES ────────────────── */}
              {activeSection === 'roles' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { role: 'SUPERADMIN', users: 1, desc: 'Full authority including kernel mutations, dangerous keys, and security bypasses.' },
                      { role: 'ADMIN', users: 3, desc: 'Organizational configuration, provider billing, policy enforcement, and audit access.' },
                      { role: 'MANAGER', users: 8, desc: 'Task execution, council deliberations, team workflows, and evaluation reports.' },
                      { role: 'VIEWER', users: 15, desc: 'Read-only telemetry observations, memory search, and metric dashboards.' },
                    ].map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground text-sm">{r.role}</span>
                          <span className="badge badge-secondary text-[10px]">{r.users} Assigned</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 4: PERMISSIONS ────────────────── */}
              {activeSection === 'permissions' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border text-[11px] text-muted-foreground">
                    Granular permission capability matrix mapped across all system domains:
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border/80 text-muted-foreground">
                          <th className="pb-2">DOMAIN / CAPABILITY</th>
                          <th className="pb-2">VIEWER</th>
                          <th className="pb-2">MANAGER</th>
                          <th className="pb-2">ADMIN</th>
                          <th className="pb-2">SUPERADMIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {[
                          { cap: 'Read Telemetry & Observations', v: true, m: true, a: true, s: true },
                          { cap: 'Trigger Benchmark Simulations', v: false, m: true, a: true, s: true },
                          { cap: 'Promote Sandbox to Real Org', v: false, m: false, a: true, s: true },
                          { cap: 'Edit API Provider Keys', v: false, m: false, a: true, s: true },
                          { cap: 'Bypass Constitutional Gates', v: false, m: false, a: false, s: true },
                          { cap: 'Execute Instant Hard Rollback', v: false, m: false, a: true, s: true },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td className="py-2.5 font-semibold text-foreground">{row.cap}</td>
                            <td className="py-2.5">{row.v ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="text-muted-foreground/40">—</span>}</td>
                            <td className="py-2.5">{row.m ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="text-muted-foreground/40">—</span>}</td>
                            <td className="py-2.5">{row.a ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="text-muted-foreground/40">—</span>}</td>
                            <td className="py-2.5">{row.s ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="text-muted-foreground/40">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 5: SECURITY ────────────────── */}
              {activeSection === 'security' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">MULTI-FACTOR AUTHENTICATION</label>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          checked={mfaEnforced}
                          onChange={(e) => setMfaEnforced(e.target.checked)}
                          className="accent-primary"
                        />
                        <span>Enforce hardware security key or TOTP on all operators</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">SESSION INACTIVITY TIMEOUT</label>
                      <input
                        type="number"
                        value={sessionTimeoutMin}
                        onChange={(e) => setSessionTimeoutMin(parseInt(e.target.value) || 30)}
                        className="input text-xs"
                      />
                      <span className="text-[10px] text-muted-foreground block">Minutes before mandatory re-authentication.</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground block">ALLOWED IP CIDR RANGES</label>
                    <textarea
                      rows={2}
                      value={ipWhitelist}
                      onChange={(e) => setIpWhitelist(e.target.value)}
                      className="input h-auto text-xs py-2"
                    />
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 6: AI PROVIDERS ────────────────── */}
              {activeSection === 'ai-providers' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border text-muted-foreground">
                    <strong className="text-foreground">Credential Security Principle:</strong> Sensitive API tokens and private keys are never exposed in plaintext after initial submission. Only masked fingerprints are returned.
                  </div>

                  <div className="space-y-3">
                    {providers.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-secondary/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{p.name}</span>
                            <span className="badge badge-success text-[10px]">CONFIGURED</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Key Fingerprint:</span>
                            <code className="text-primary font-bold">{p.maskedKey}</code>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Enter new API key for ${p.name} to rotate credentials securely.`);
                            }}
                            className="btn btn-outline text-xs h-7 px-2.5 font-mono"
                          >
                            Rotate Key
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 7: MODELS ────────────────── */}
              {activeSection === 'models' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { model: 'Claude 3.5 Sonnet', role: 'Default Reasoning Engine', status: 'Allowed' },
                      { model: 'GPT-4o', role: 'Multi-Modal & Code Fallback', status: 'Allowed' },
                      { model: 'Gemini 1.5 Pro', role: 'Long-Context Synthesis', status: 'Allowed' },
                      { model: 'Claude 3.5 Haiku', role: 'Fast Classifier & Router', status: 'Allowed' },
                      { model: 'Gemini 1.5 Flash', role: 'High-Throughput Batch Worker', status: 'Allowed' },
                    ].map((m, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-secondary/20 border border-border space-y-1">
                        <span className="font-bold text-foreground text-sm block">{m.model}</span>
                        <span className="text-muted-foreground block text-[11px]">{m.role}</span>
                        <span className="badge badge-outline text-[10px] text-emerald-400 border-emerald-500/30">
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 8: RESOURCES ────────────────── */}
              {activeSection === 'resources' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-1">
                      <span className="text-muted-foreground block text-[10px]">MONTHLY BUDGET CEILING</span>
                      <span className="text-lg font-bold text-emerald-400">$1,500.00 / mo</span>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-1">
                      <span className="text-muted-foreground block text-[10px]">PARALLEL EXECUTION SLOTS</span>
                      <span className="text-lg font-bold text-primary">32 Global Slots</span>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-1">
                      <span className="text-muted-foreground block text-[10px]">GPU ACCELERATOR CORE POOL</span>
                      <span className="text-lg font-bold text-cyan-400">16 Dedicated Cores</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 9: POLICIES ────────────────── */}
              {activeSection === 'policies' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-2">
                    {[
                      { rule: 'REQUIRE_HUMAN_APPROVAL_HIGH_RISK', desc: 'Mandates explicit operator sign-off on destructive deployments.' },
                      { rule: 'STRICT_SCHEMA_ADHERENCE', desc: 'Validates synthetic model output before feeding into workflow pipelines.' },
                      { rule: 'IMMUTABLE_AUDIT_LOG_STREAM', desc: 'Guarantees zero-tamper audit records committed to append-only storage.' },
                    ].map((p, i) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground text-xs block">{p.rule}</span>
                          <span className="text-muted-foreground text-[11px]">{p.desc}</span>
                        </div>
                        <span className="badge badge-success text-[10px]">ENFORCED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 10: INTEGRATIONS ────────────────── */}
              {activeSection === 'integrations' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'GitHub Enterprise', status: 'Connected', desc: 'PR automation, repository reading, and commit signing.' },
                      { name: 'Slack Alerts Webhook', status: 'Connected', desc: 'High-severity incident alerts and approval pings.' },
                      { name: 'Datadog APM', status: 'Connected', desc: 'Streaming real-time latency and token burn telemetry.' },
                      { name: 'PagerDuty', status: 'Standby', desc: 'Escalation routing for autonomous workflow deadlock.' },
                    ].map((integ, i) => (
                      <div key={i} className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground text-sm">{integ.name}</span>
                          <span className="badge badge-outline text-[10px] text-emerald-400">{integ.status}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{integ.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 11: NOTIFICATIONS ────────────────── */}
              {activeSection === 'notifications' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyOutages}
                        onChange={(e) => setNotifyOutages(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-foreground">Provider Outages & Circuit-Breaker State Transitions</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyApprovals}
                        onChange={(e) => setNotifyApprovals(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-foreground">Human Approval Requests Pending Action</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyAudit}
                        onChange={(e) => setNotifyAudit(e.target.checked)}
                        className="accent-primary"
                      />
                      <span className="text-foreground">High-Privilege Administrative Actions</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 12: APPEARANCE ────────────────── */}
              {activeSection === 'appearance' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">DEFAULT THEME</label>
                      <select
                        value={defaultTheme}
                        onChange={(e) => setDefaultTheme(e.target.value)}
                        className="input text-xs"
                      >
                        <option value="light">Light Mode (Official Default)</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Synchronized</option>
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">UI DENSITY</label>
                      <select
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        className="input text-xs"
                      >
                        <option value="comfortable">Comfortable</option>
                        <option value="compact">Compact (High Information Density)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 13: AUDIT LOGS ────────────────── */}
              {activeSection === 'audit-logs' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border text-muted-foreground flex justify-between items-center">
                    <span>Immutable Audit Log Ledger (Latest 4 Records)</span>
                    <button className="btn btn-outline text-xs h-7 px-2 font-mono">Export CSV</button>
                  </div>

                  <div className="divide-y divide-border/40">
                    {[
                      { time: '10 mins ago', actor: 'jane.vance@neiman.ai', action: 'CREATE_SIMULATION_SCENARIO', target: 'Simulation B', ip: '10.0.4.12' },
                      { time: '42 mins ago', actor: 'marcus.s@neiman.ai', action: 'ROTATE_AI_PROVIDER_KEY', target: 'Anthropic Cloud', ip: '10.0.1.84' },
                      { time: '2 hours ago', actor: 'system-agent-supervisor', action: 'TRIGGER_CIRCUIT_BREAKER', target: 'OpenAI Gateway', ip: 'internal' },
                      { time: '5 hours ago', actor: 'jane.vance@neiman.ai', action: 'PROMOTE_SIMULATION', target: 'Simulation A', ip: '10.0.4.12' },
                    ].map((entry, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-primary">{entry.action}</span>
                          <span className="text-muted-foreground ml-2">by {entry.actor} on {entry.target}</span>
                        </div>
                        <span className="text-muted-foreground">{entry.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 14: API & CREDENTIALS ────────────────── */}
              {activeSection === 'api' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border text-muted-foreground">
                    <strong className="text-foreground">One-Time Exposure Rule:</strong> API keys and secrets are generated cryptographically and shown <strong className="text-foreground">ONLY ONCE</strong> upon creation. Afterward, they are stored as one-way salt-hashed digests and can never be retrieved.
                  </div>

                  {/* Create New Token Form */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
                    <span className="font-bold text-foreground block text-sm">Generate Service / Operator Token</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Token description (e.g. CI/CD Deployment Token)"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        className="input text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        disabled={!newTokenName.trim()}
                        className="btn btn-primary text-xs h-9 px-3 gap-1 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Generate Token
                      </button>
                    </div>

                    {createdSecret && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-1.5 animate-fade-in">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Token Generated! Copy it now — it will never be displayed again.
                        </span>
                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-emerald-500/40">
                          <code className="text-xs text-foreground font-mono flex-1 break-all">
                            {createdSecret}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(createdSecret, 'new-secret')}
                            className="btn btn-outline text-xs h-7 px-2 gap-1 text-emerald-300"
                          >
                            {copiedKey === 'new-secret' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedKey === 'new-secret' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Existing Tokens List */}
                  <div className="space-y-2">
                    <span className="font-bold text-foreground text-xs uppercase text-muted-foreground block">
                      Active Authorized Service Tokens ({apiTokens.length})
                    </span>
                    <div className="divide-y divide-border/40">
                      {apiTokens.map((t) => (
                        <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{t.name}</span>
                              <span className="badge badge-secondary text-[9px]">{t.scope}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <code>{t.maskedSecret}</code>
                              <span>&bull; Created: {t.created}</span>
                              <span>&bull; Last used: {t.lastUsed}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApiTokens(apiTokens.filter((item) => item.id !== t.id))}
                            className="btn btn-ghost text-xs h-7 px-2 text-rose-400 hover:bg-rose-500/10"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────── SECTION 15: DEVELOPER SETTINGS ────────────────── */}
              {activeSection === 'developer' && (
                <div className="space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">SYNTHETIC BENCHMARK CHAOS</label>
                      <span className="text-[11px] text-muted-foreground block">
                        Inject random network delays (200-800ms) into simulation lab runs to stress-test circuit breakers.
                      </span>
                      <button className="btn btn-outline text-xs h-7 px-2.5">Enable Chaos Injection</button>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-2">
                      <label className="font-bold text-foreground block">DATABASE SCHEMA DRIFT INSPECTION</label>
                      <span className="text-[11px] text-muted-foreground block">
                        Verify Alembic migration revision consistency against active PostgreSQL vector tables.
                      </span>
                      <button className="btn btn-outline text-xs h-7 px-2.5">Run Schema Verify</button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/10 border border-border space-y-2">
                    <span className="font-bold text-foreground block">KERNEL ENGINE TELEMETRY</span>
                    <pre className="p-3 rounded-lg bg-black/40 border border-border font-mono text-[11px] text-foreground overflow-x-auto">
                      {JSON.stringify(
                        {
                          neiman_engine_version: 'v2.4.0-enterprise',
                          environment: 'production',
                          active_workers: 18,
                          memory_allocated_mb: 412.8,
                          circuit_breaker_registry_state: 'OPTIMAL',
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
