'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useQuery } from '@tanstack/react-query';
import { governanceApi } from '@/lib/api/governance';
import { useOrganizationContext } from '@/lib/organizationContext';
import { isDevelopmentAuthBypassEnabled } from '@/lib/authPreview';

interface MagneticGrainOrbProps {
  onOpenDrawer?: (drawerId: string) => void;
  className?: string;
}

export function MagneticGrainOrb({ className = '' }: MagneticGrainOrbProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';

  const [isHovered, setIsHovered] = useState(false);

  const isPreview = isDevelopmentAuthBypassEnabled();
  const { data: audits = [] } = useQuery({
    queryKey: ['governance-audits-live', companyId],
    queryFn: () => governanceApi.queryAudits(companyId, { limit: 10 }),
    enabled: !!companyId && !isPreview,
    refetchInterval: 5000,
  });

  const latestAudit = audits.length > 0 ? audits[0] : null;
  const hasAlert = audits.some((a) => a.result === 'DENIED' || a.result === 'BLOCKED');
  const hasApproval = audits.some((a) => a.result === 'PENDING');

  // Three.js 3D Magnetic Grain Sphere Engine
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 760;
    const height = 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. High-Density Fibonacci Sphere (18,000 grains)
    const particleCount = 18000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const baseRadius = 68;

    // Chromatic Palettes matching the ferrofluid grain reference:
    // Top: Deep Cyan / Electric Blue
    // Equator: Deep Cobalt / Violet
    // Bottom: Glowing Coral, Hot Pink & Crimson
    const cTop = new THREE.Color(0x38bdf8);
    const cMid = new THREE.Color(0x2563eb);
    const cBottomPink = new THREE.Color(0xf43f5e);
    const cBottomOrange = new THREE.Color(0xfb923c);
    const cAlert = new THREE.Color(0xef4444);

    for (let i = 0; i < particleCount; i++) {
      // Golden spiral distribution across sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Natural grain thickness variance
      const variance = (Math.random() - 0.5) * 4.5;
      const r = baseRadius + variance;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.8 + Math.random() * 1.6;

      // Chromatic vertical gradient mapping (from bottom to top)
      const normalizedY = (y / baseRadius + 1) / 2;
      const pColor = new THREE.Color();

      if (hasAlert) {
        pColor.copy(cAlert).lerp(cBottomOrange, Math.random() * 0.4);
      } else if (normalizedY < 0.35) {
        pColor.copy(cBottomOrange).lerp(cBottomPink, normalizedY / 0.35);
      } else if (normalizedY < 0.65) {
        pColor.copy(cBottomPink).lerp(cMid, (normalizedY - 0.35) / 0.3);
      } else {
        pColor.copy(cMid).lerp(cTop, (normalizedY - 0.65) / 0.35);
      }

      colors[i * 3] = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 3. Circular Grain Particle Texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const pointTexture = new THREE.CanvasTexture(canvas);

    // 4. Particle Material with additive blending
    const material = new THREE.PointsMaterial({
      size: 1.85,
      map: pointTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 5. Mouse Inertia Tracking
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
      targetRotY = mouseX * 0.75;
      targetRotX = mouseY * 0.45;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Fluid inertia damping
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      particles.rotation.y = time * 0.12 + currentRotY;
      particles.rotation.x = Math.sin(time * 0.15) * 0.08 + currentRotX;

      // Ferrofluid organic magnetic surface breathing displacement
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];

        // 3D curl wave displacement
        const wave =
          Math.sin(by * 0.08 + time * 2.2 + phases[i]) *
          Math.cos(bx * 0.08 + time * 1.8) *
          2.8;

        const displacement = 1.0 + wave / baseRadius;

        posArray[i * 3] = bx * displacement;
        posArray[i * 3 + 1] = by * displacement;
        posArray[i * 3 + 2] = bz * displacement;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      pointTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [hasAlert, hasApproval]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none py-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D THREE.JS SPHERE CONTAINER */}
      <div className="relative w-[760px] h-[500px] flex items-center justify-center overflow-visible">
        {/* Subtle dark ambient circular vignette to pop particles on light & dark themes */}
        <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-black/85 blur-3xl opacity-80" />

        {/* Three.js canvas container */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto"
        />
      </div>

      {/* Live Telemetry Status Pill */}
      <div className="min-h-[38px] mt-1 flex items-center justify-center z-20">
        {latestAudit ? (
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/80 bg-card/60 px-3 py-1 rounded-full border border-border/40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D71921] animate-ping" />
            <span>Telemetry: {latestAudit.actor_name} — {latestAudit.action}</span>
          </div>
        ) : (
          <div className="text-xs font-mono text-muted-foreground/60 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Core Organic Picture · Nominal Ferrofluid Dynamics</span>
          </div>
        )}
      </div>
    </div>
  );
}
