'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  Bot,
  Briefcase,
  Zap,
  CheckSquare,
  Shield,
  Layers,
  Activity,
  Brain,
  Sparkles,
  Scale,
  Users,
  FlaskConical,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { governanceApi } from '@/lib/api/governance';
import { useOrganizationContext } from '@/lib/organizationContext';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';

interface SatelliteModule {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  description: string;
  stat: string;
  category: string;
}

const SATELLITE_MODULES: SatelliteModule[] = [
  { id: 'workforce', name: 'AI Workforce', href: '/dashboard/agents', icon: Bot, description: 'Active agents & mission control', stat: '6 Active', category: 'execution' },
  { id: 'workflows', name: 'Workflows', href: '/dashboard/workflows', icon: GitBranch, description: 'Visual pipeline composer & observability', stat: 'Delivery v2', category: 'execution' },
  { id: 'intelligence', name: 'Intelligence', href: '/dashboard/intelligence', icon: Zap, description: 'Multi-provider routing & circuit breakers', stat: '340ms P50', category: 'intelligence' },
  { id: 'memory', name: 'Org Memory', href: '/dashboard/memory', icon: Brain, description: 'Vector repository & collective recall', stat: '42.9k Chunks', category: 'intelligence' },
  { id: 'projects', name: 'Projects', href: '/dashboard/projects', icon: Briefcase, description: 'Milestones, roadmap & burn rates', stat: '3 Active', category: 'core' },
  { id: 'organization', name: 'Org Map', href: '/dashboard/organization', icon: Layers, description: 'Interactive visual hierarchy', stat: '4 Depts', category: 'core' },
  { id: 'tasks', name: 'Task Stream', href: '/dashboard/tasks', icon: CheckSquare, description: 'Autonomous task execution queue', stat: '12 Queued', category: 'execution' },
  { id: 'approvals', name: 'Approvals', href: '/dashboard/approvals', icon: Shield, description: 'Executive human sign-offs & gates', stat: '1 Pending', category: 'governance' },
  { id: 'decisions', name: 'Decisions', href: '/dashboard/decisions', icon: Scale, description: 'Consensus ledger & rationale records', stat: '148 Logged', category: 'governance' },
  { id: 'evolution', name: 'Evolution Lab', href: '/dashboard/evolution', icon: Sparkles, description: 'Architecture & mutation proposals', stat: '+14% Eff', category: 'intelligence' },
  { id: 'simulation', name: 'Simulation', href: '/dashboard/simulation', icon: FlaskConical, description: 'Digital twin stress-testing', stat: '99.4% Resil', category: 'intelligence' },
  { id: 'departments', name: 'Departments', href: '/dashboard/departments', icon: Users, description: 'Divisions & budget envelopes', stat: '4 Units', category: 'core' },
];

interface Grain {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  layer: number;
}

export function MagneticGrainOrb() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';

  const [isHovered, setIsHovered] = useState(false);
  const [activeModuleHover, setActiveModuleHover] = useState<SatelliteModule | null>(null);
  const [bloomOpen, setBloomOpen] = useState(true);

  const isPreview = isDevelopmentAuthBypassEnabled();
  // Live Audits telemetry for dynamic particle pulse
  const { data: audits = [] } = useQuery({
    queryKey: ['governance-audits-live', companyId],
    queryFn: () => governanceApi.queryAudits(companyId, { limit: 10 }),
    enabled: !!companyId && !isPreview,
    refetchInterval: 5000,
  });

  const latestAudit = audits.length > 0 ? audits[0] : null;

  // Derive System Rhythm
  const hasAlert = audits.some((a) => a.result === 'DENIED' || a.result === 'BLOCKED');
  const hasApproval = audits.some((a) => a.result === 'PENDING');

  const coreColor = hasAlert ? '#ef4444' : hasApproval ? '#f59e0b' : '#a3e635'; // Neon lime default

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = 540;
    const height = 360;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const centerX = width / 2;
    const centerY = height / 2;
    const numGrains = 650;
    const grains: Grain[] = [];

    // Initialize 3D Spherical Grains (Fibonacci sphere distribution)
    for (let i = 0; i < numGrains; i++) {
      const radius = 65 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);

      const colorVariant = Math.random();
      let color = '#a3e635'; // Neon lime
      if (colorVariant > 0.7) color = '#06b6d4'; // Cyan
      if (colorVariant > 0.9) color = '#ffffff'; // White specular spark

      grains.push({
        x: centerX + x,
        y: centerY + y,
        originX: centerX + x,
        originY: centerY + y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 0.8 + Math.random() * 1.6,
        color,
        alpha: 0.3 + Math.random() * 0.7,
        baseAlpha: 0.3 + Math.random() * 0.7,
        orbitRadius: radius,
        orbitAngle: theta,
        orbitSpeed: (0.004 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1),
        layer: Math.cos(phi), // For depth illusion
      });
    }

    let mouseX = centerX;
    let mouseY = centerY;
    let targetExpansion = 1;
    let currentExpansion = 1;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Expansion factor when hovered or bloomed
      targetExpansion = isHovered || bloomOpen ? 1.65 : 1.0;
      currentExpansion += (targetExpansion - currentExpansion) * 0.08;

      // Draw subtle gravitational ambient glow
      const radialGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        15,
        centerX,
        centerY,
        120 * currentExpansion
      );
      radialGradient.addColorStop(0, hasAlert ? 'rgba(239,68,68,0.22)' : 'rgba(163,230,53,0.18)');
      radialGradient.addColorStop(0.5, 'rgba(6,182,212,0.06)');
      radialGradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw Ferrofluid Grains
      grains.forEach((g) => {
        // Orbit dynamics
        g.orbitAngle += g.orbitSpeed;
        const targetRadius = g.orbitRadius * currentExpansion;
        const targetX = centerX + Math.cos(g.orbitAngle) * targetRadius;
        const targetY = centerY + Math.sin(g.orbitAngle) * targetRadius * 0.75; // Isometric tilt

        // Magnetic displacement to mouse
        const dx = mouseX - g.x;
        const dy = mouseY - g.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 90;

        if (dist < maxDist && dist > 0) {
          const force = (1 - dist / maxDist) * 12;
          g.x -= (dx / dist) * force;
          g.y -= (dy / dist) * force;
        }

        // Spring back to orbit target
        g.x += (targetX - g.x) * 0.08;
        g.y += (targetY - g.y) * 0.08;

        // Draw grain
        ctx.beginPath();
        const drawRadius = g.size * (0.8 + g.layer * 0.4);
        ctx.arc(g.x, g.y, Math.max(0.4, drawRadius), 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.globalAlpha = g.alpha * (0.6 + g.layer * 0.4);
        ctx.shadowColor = g.color;
        ctx.shadowBlur = isHovered ? 4 : 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Central Quantum Core Spark
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5 * currentExpansion, 0, Math.PI * 2);
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered, bloomOpen, hasAlert, hasApproval, coreColor]);

  // Calculate Radial Positions for Orbiting Satellites (12 Satellites in 360 degrees)
  const radiusX = 200; // Horizontal orbit radius
  const radiusY = 135; // Vertical orbit radius for perspective flattening
  const satellites = useMemo(() => {
    return SATELLITE_MODULES.map((mod, index) => {
      const angle = (index / SATELLITE_MODULES.length) * 2 * Math.PI - Math.PI / 2;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      return { ...mod, x, y, angle };
    });
  }, [radiusX, radiusY]);

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!bloomOpen) setActiveModuleHover(null);
      }}
    >
      {/* 1. CANVAS FERROFLUID GRAIN ORB */}
      <div className="relative w-[540px] h-[360px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto"
          onClick={() => setBloomOpen((prev) => !prev)}
          title="Click to toggle Orbital Constellation"
        />

        {/* Center Core HUD Trigger Button */}
        <button
          type="button"
          onClick={() => setBloomOpen((prev) => !prev)}
          className="absolute z-20 flex flex-col items-center justify-center group focus:outline-none"
        >
          <div className="p-3 rounded-full bg-card/80 border border-primary/40 backdrop-blur-md shadow-2xl shadow-primary/20 group-hover:scale-110 group-hover:border-primary transition-all">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <span className="mt-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground group-hover:text-primary transition-colors">
            {bloomOpen ? 'Collapse Constellation' : 'NEXORA Core'}
          </span>
        </button>

        {/* 2. RADIAL ORBITAL SATELLITES (Blooms outwards on hover or toggle) */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-500 ease-out ${
            isHovered || bloomOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
        >
          {satellites.map((sat) => {
            const Icon = sat.icon;
            const isSelected = activeModuleHover?.id === sat.id;

            return (
              <div
                key={sat.id}
                style={{
                  transform: `translate(${sat.x + 270 - 20}px, ${sat.y + 180 - 20}px)`,
                }}
                className="absolute z-30 pointer-events-auto transition-transform duration-300"
              >
                <button
                  type="button"
                  onClick={() => router.push(sat.href)}
                  onMouseEnter={() => setActiveModuleHover(sat)}
                  className={`group relative flex items-center justify-center h-10 w-10 rounded-2xl border backdrop-blur-xl transition-all shadow-lg ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary scale-125 shadow-primary/30'
                      : 'bg-card/90 text-foreground/80 border-border/80 hover:border-primary hover:text-primary hover:scale-115'
                  }`}
                  title={`${sat.name} · ${sat.description}`}
                >
                  <Icon className="h-4 w-4" />

                  {/* Micro label pill below satellite */}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-background/90 border border-border/80 text-[9px] font-mono whitespace-nowrap text-muted-foreground group-hover:text-primary transition-colors shadow-xs">
                    {sat.name}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE SATELLITE TELEMETRY PEEK CARD */}
      <div className="min-h-[50px] mt-1 flex items-center justify-center">
        {activeModuleHover ? (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-card/90 border border-primary/30 backdrop-blur-md shadow-xl animate-fade-in text-xs font-mono">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <activeModuleHover.icon className="h-3.5 w-3.5 text-primary" />
              {activeModuleHover.name}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{activeModuleHover.description}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-semibold">{activeModuleHover.stat}</span>
            <button
              type="button"
              onClick={() => router.push(activeModuleHover.href)}
              className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              Enter <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        ) : latestAudit ? (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <span>Telemetry: {latestAudit.actor_name} — {latestAudit.action}</span>
          </div>
        ) : (
          <div className="text-xs font-mono text-muted-foreground/60">
            Hover over the Magnetic Grain Orb to reveal the Radial Navigation Constellation
          </div>
        )}
      </div>
    </div>
  );
}
