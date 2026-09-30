'use client';

import type { ReactNode } from 'react';
import { Activity, Bot, Layers3, ShieldCheck, Sparkles } from 'lucide-react';

interface OrganizationCoreProps {
  companyName: string;
  companyStatus: string;
  departments: number;
  agents: number;
  activeAgents: number;
  activeTasks: number;
  pendingApprovals: number;
  onOpenGraph: () => void;
}

/** A spatial overview of the organization, designed around its human-governed core. */
export function OrganizationCore({
  companyName,
  companyStatus,
  departments,
  agents,
  activeAgents,
  activeTasks,
  pendingApprovals,
  onOpenGraph,
}: OrganizationCoreProps) {
  return (
    <section className="org-core-panel" aria-labelledby="org-core-title">
      <div className="org-core-spotlight" aria-hidden="true" />
      <div className="org-core-grain" aria-hidden="true" />
      <header className="org-core-header">
        <div>
          <div className="org-core-kicker"><span /> ORGANIZATION SYSTEM / 01</div>
          <h2 id="org-core-title">A living system, under human authority.</h2>
          <p>People, agents, and intelligence providers connected through one governed organization.</p>
        </div>
        <div className="org-core-status"><span className="org-core-status-dot" /> {companyStatus} <i /> CORE STABLE</div>
      </header>

      <div className="org-core-stage" aria-label={`${companyName} organization system visualization`}>
        <div className="org-core-grid" aria-hidden="true" />
        <div className="org-core-vignette" aria-hidden="true" />
        <div className="org-orbit-system" aria-hidden="true">
          <div className="org-orbit org-orbit-outer"><span className="org-orbit-beacon" /></div>
          <div className="org-orbit org-orbit-inner"><span className="org-orbit-beacon" /></div>
          <div className="org-orbit org-orbit-equator" />
          <div className="org-core-aura" />
          <div className="org-core-sphere"><div className="org-core-sphere-glint" /><span>N</span></div>
          <span className="org-core-orbit-label">NEXORA · ORGANIZATION CORE</span>
        </div>

        <CoreSatellite className="org-satellite org-satellite-workforce" label="WORKFORCE" value={`${agents} employees`} detail={`${activeAgents} active now`} icon={<Bot aria-hidden="true" />} onClick={onOpenGraph} />
        <CoreSatellite className="org-satellite org-satellite-departments" label="DEPARTMENTS" value={`${departments} teams`} detail="Shared purpose · distinct roles" icon={<Layers3 aria-hidden="true" />} onClick={onOpenGraph} />
        <CoreSatellite className="org-satellite org-satellite-execution" label="EXECUTION" value={`${activeTasks} in motion`} detail="Work moves through governed flows" icon={<Activity aria-hidden="true" />} onClick={onOpenGraph} />
        <CoreSatellite className="org-satellite org-satellite-authority" label="HUMAN AUTHORITY" value={`${pendingApprovals} review gate${pendingApprovals === 1 ? '' : 's'}`} detail="Consequential actions stay supervised" icon={<ShieldCheck aria-hidden="true" />} onClick={onOpenGraph} />
      </div>

      <footer className="org-core-footer">
        <span><Sparkles aria-hidden="true" /> {companyName}</span>
        <span>CAPABILITY ROUTING <i /> ORGANIZATION MEMORY <i /> VALIDATED CHANGE</span>
      </footer>
    </section>
  );
}

function CoreSatellite({
  className,
  label,
  value,
  detail,
  icon,
  onClick,
}: {
  className: string;
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={className} onClick={onClick} aria-label={`${label}: ${value}. Open organization graph.`}>
      <span className="org-satellite-icon">{icon}</span>
      <span className="org-satellite-copy">
        <span className="org-satellite-label">{label}</span>
        <span className="org-satellite-value">{value}</span>
        <span className="org-satellite-detail">{detail}</span>
      </span>
      <span className="org-satellite-link" aria-hidden="true">↗</span>
    </button>
  );
}
