'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  Layers,
  Network,
  GitFork,
  Zap,
  Cpu,
  Database,
  Sparkles,
  Maximize2,
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  Sliders,
  Eye,
} from 'lucide-react';
import type { Agent } from '@/lib/api/agents';
import type { Task, Project, ApprovalRequest, ResourceMetrics } from '@/lib/api/controlRoom';
import type { ActivityEvent } from '@neiman/events';

export type CognitiveCoreMode =
  | 'TOPOLOGY'
  | 'COLLABORATION'
  | 'WORKFLOW'
  | 'ROUTING'
  | 'RESOURCE_FLOW'
  | 'MEMORY_GRAPH'
  | 'EVOLUTION';

export interface CoreNode {
  id: string;
  name: string;
  type: 'core' | 'department' | 'agent' | 'task' | 'model' | 'memory' | 'evolution';
  status: string;
  role?: string;
  autonomy?: string;
  assignedModel?: string;
  currentTask?: string;
  latency?: string;
  cost?: string;
  computePct?: number;
  colorHex: number;
  radius: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  pulsePhase: number;
  metadata?: Record<string, unknown>;
}

export interface CoreLink {
  sourceId: string;
  targetId: string;
  type: 'hierarchy' | 'collaboration' | 'data' | 'routing' | 'dependency';
  colorHex: number;
  curvature: number;
  activityLevel: number;
}

interface CognitiveCoreProps {
  agents: Agent[];
  tasks: Task[];
  projects: Project[];
  approvals: ApprovalRequest[];
  resources: ResourceMetrics;
  activity: ActivityEvent[];
  activeMode: CognitiveCoreMode;
  onModeChange: (mode: CognitiveCoreMode) => void;
  selectedNodeId?: string | null;
  onSelectNode: (node: CoreNode | null) => void;
  timelineMinutes?: number;
  onTimelineChange?: (minutes: number) => void;
  className?: string;
}

const MODES: Array<{ id: CognitiveCoreMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'TOPOLOGY', label: 'Topology', icon: Layers },
  { id: 'COLLABORATION', label: 'Collaboration', icon: Network },
  { id: 'WORKFLOW', label: 'Workflows', icon: GitFork },
  { id: 'ROUTING', label: 'Model Routing', icon: Zap },
  { id: 'RESOURCE_FLOW', label: 'Resource Flow', icon: Cpu },
  { id: 'MEMORY_GRAPH', label: 'Memory Graph', icon: Database },
  { id: 'EVOLUTION', label: 'Evolution', icon: Sparkles },
];

export function CognitiveCore({
  agents,
  tasks,
  projects,
  approvals,
  resources,
  activity,
  activeMode,
  onModeChange,
  selectedNodeId,
  onSelectNode,
  timelineMinutes = 0,
  onTimelineChange,
  className = '',
}: CognitiveCoreProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<CoreNode | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // References to keep Three.js state reactive without re-instantiating scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<Map<string, CoreNode>>(new Map());
  const linksRef = useRef<CoreLink[]>([]);
  const selectedIdRef = useRef<string | null>(selectedNodeId || null);
  selectedIdRef.current = selectedNodeId || null;

  // Build reactive node universe according to organization state and selected mode
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, CoreNode>();
    const linkList: CoreLink[] = [];

    // 1. NEIMAN Central Core (Origin)
    nodeMap.set('neiman-core', {
      id: 'neiman-core',
      name: 'NEIMAN COGNITIVE CORE',
      type: 'core',
      status: 'AUTONOMOUS',
      role: 'Operating System Hub',
      colorHex: 0x00f2fe, // Electric Cyan
      radius: 14,
      position: new THREE.Vector3(0, 0, 0),
      targetPosition: new THREE.Vector3(0, 0, 0),
      pulsePhase: 0,
    });

    if (activeMode === 'TOPOLOGY') {
      // Departments orbiting central core
      const depts = [
        { id: 'dept-eng', name: 'Engineering & Architecture', color: 0x06b6d4, angle: 0 },
        { id: 'dept-sec', name: 'Security & Sentinel Ops', color: 0xef4444, angle: (Math.PI * 2) / 5 },
        { id: 'dept-exec', name: 'Executive Council', color: 0xf59e0b, angle: ((Math.PI * 2) / 5) * 2 },
        { id: 'dept-ops', name: 'Infrastructure & Compute', color: 0x10b981, angle: ((Math.PI * 2) / 5) * 3 },
        { id: 'dept-intel', name: 'Cognitive Intelligence', color: 0x8b5cf6, angle: ((Math.PI * 2) / 5) * 4 },
      ];

      depts.forEach((d) => {
        const radius = 60;
        const x = Math.cos(d.angle) * radius;
        const y = Math.sin(d.angle) * radius * 0.45;
        const z = Math.sin(d.angle) * radius * 0.85;

        nodeMap.set(d.id, {
          id: d.id,
          name: d.name,
          type: 'department',
          status: 'ACTIVE',
          colorHex: d.color,
          radius: 9,
          position: new THREE.Vector3(x, y, z),
          targetPosition: new THREE.Vector3(x, y, z),
          pulsePhase: Math.random() * Math.PI,
        });

        linkList.push({
          sourceId: 'neiman-core',
          targetId: d.id,
          type: 'hierarchy',
          colorHex: d.color,
          curvature: 0.15,
          activityLevel: 0.8,
        });
      });

      // Agents in outer planetary shell
      agents.forEach((ag, idx) => {
        const total = Math.max(agents.length, 1);
        const theta = (idx / total) * Math.PI * 2;
        const orbitR = 105;
        const x = Math.cos(theta) * orbitR;
        const y = Math.sin(theta * 1.5) * 28;
        const z = Math.sin(theta) * orbitR;

        const isWorking = ag.status === 'WORKING' || ag.status === 'ACTIVE';
        const color = isWorking ? 0x10b981 : ag.status === 'BLOCKED' ? 0xef4444 : 0x38bdf8;

        nodeMap.set(ag.id, {
          id: ag.id,
          name: ag.name,
          type: 'agent',
          status: ag.status,
          role: ag.role_id,
          autonomy: ag.autonomy,
          currentTask: ag.status === 'WORKING' ? 'Executing distributed inference' : 'Standby',
          assignedModel: 'Claude 3.5 Sonnet',
          colorHex: color,
          radius: isWorking ? 6.5 : 5,
          position: new THREE.Vector3(x, y, z),
          targetPosition: new THREE.Vector3(x, y, z),
          pulsePhase: idx * 0.4,
        });

        // Link agent to corresponding department
        const targetDept = depts[idx % depts.length].id;
        linkList.push({
          sourceId: targetDept,
          targetId: ag.id,
          type: 'hierarchy',
          colorHex: color,
          curvature: 0.2,
          activityLevel: isWorking ? 1 : 0.2,
        });
      });
    } else if (activeMode === 'COLLABORATION') {
      // Force-directed Swarm Network
      agents.forEach((ag, idx) => {
        const total = Math.max(agents.length, 1);
        const phi = Math.acos(-1 + (2 * idx) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        const r = 75 + (idx % 2 === 0 ? 15 : -10);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta) * 0.8;
        const z = r * Math.cos(phi);

        const isWorking = ag.status === 'WORKING' || ag.status === 'ACTIVE';
        nodeMap.set(ag.id, {
          id: ag.id,
          name: ag.name,
          type: 'agent',
          status: ag.status,
          role: ag.role_id,
          autonomy: ag.autonomy,
          currentTask: 'Dynamic consensus coordination',
          colorHex: isWorking ? 0x00f2fe : 0x8b5cf6,
          radius: 7,
          position: new THREE.Vector3(x, y, z),
          targetPosition: new THREE.Vector3(x, y, z),
          pulsePhase: Math.random() * Math.PI,
        });
      });

      // Inter-agent collaboration links
      const agentIds = Array.from(nodeMap.keys()).filter((k) => k !== 'neiman-core');
      for (let i = 0; i < agentIds.length; i++) {
        const next = agentIds[(i + 1) % agentIds.length];
        linkList.push({
          sourceId: agentIds[i],
          targetId: next,
          type: 'collaboration',
          colorHex: 0x00f2fe,
          curvature: 0.25,
          activityLevel: 0.9,
        });
        if (i % 2 === 0) {
          linkList.push({
            sourceId: 'neiman-core',
            targetId: agentIds[i],
            type: 'data',
            colorHex: 0x8b5cf6,
            curvature: 0.1,
            activityLevel: 0.7,
          });
        }
      }
    } else if (activeMode === 'WORKFLOW') {
      // 3D Pipeline DAG Stages: Ingestion -> Reasoning -> Verification -> Synthesis -> Commit
      const stages = ['Ingestion', 'Reasoning', 'Verification', 'Synthesis', 'Commit'];
      stages.forEach((stg, sIdx) => {
        const x = (sIdx - 2) * 55;
        const sId = `stg-${sIdx}`;
        nodeMap.set(sId, {
          id: sId,
          name: `Pipeline Stage: ${stg}`,
          type: 'task',
          status: sIdx <= 2 ? 'COMPLETED' : sIdx === 3 ? 'IN_PROGRESS' : 'PENDING',
          colorHex: sIdx <= 2 ? 0x10b981 : sIdx === 3 ? 0xf59e0b : 0x737373,
          radius: 10,
          position: new THREE.Vector3(x, 15, 0),
          targetPosition: new THREE.Vector3(x, 15, 0),
          pulsePhase: sIdx,
        });

        if (sIdx > 0) {
          linkList.push({
            sourceId: `stg-${sIdx - 1}`,
            targetId: sId,
            type: 'dependency',
            colorHex: sIdx <= 3 ? 0x10b981 : 0x525252,
            curvature: 0.05,
            activityLevel: sIdx === 3 ? 1 : 0.3,
          });
        }
      });

      // Sub-tasks branched beneath stages
      tasks.slice(0, 8).forEach((tsk, tIdx) => {
        const parentStage = `stg-${tIdx % stages.length}`;
        const pNode = nodeMap.get(parentStage);
        if (pNode) {
          const x = pNode.position.x + (Math.random() - 0.5) * 20;
          const y = -35 + (tIdx % 2) * 15;
          const z = (Math.random() - 0.5) * 35;
          const isDone = tsk.status === 'COMPLETED';
          const isAct = tsk.status === 'IN_PROGRESS';

          nodeMap.set(tsk.id, {
            id: tsk.id,
            name: tsk.title,
            type: 'task',
            status: tsk.status,
            colorHex: isDone ? 0x10b981 : isAct ? 0xf59e0b : 0xef4444,
            radius: 5.5,
            position: new THREE.Vector3(x, y, z),
            targetPosition: new THREE.Vector3(x, y, z),
            pulsePhase: tIdx * 0.5,
          });

          linkList.push({
            sourceId: parentStage,
            targetId: tsk.id,
            type: 'dependency',
            colorHex: isAct ? 0xf59e0b : 0x06b6d4,
            curvature: 0.3,
            activityLevel: isAct ? 1 : 0.4,
          });
        }
      });
    } else if (activeMode === 'ROUTING') {
      // Model Gateways in cardinal orbital anchors
      const models = [
        { id: 'mod-claude', name: 'Anthropic Claude 3.5 Sonnet', tier: 'Tier-1 Primary', latency: '240ms', cost: '$3.00/M', color: 0x06b6d4, pos: [-70, 25, 0] },
        { id: 'mod-gpt4o', name: 'OpenAI GPT-4o Omni', tier: 'Tier-1 Reasoning', latency: '190ms', cost: '$2.50/M', color: 0x10b981, pos: [70, 25, 0] },
        { id: 'mod-gemini', name: 'Google Gemini 1.5 Pro', tier: 'Tier-2 Context', latency: '310ms', cost: '$1.25/M', color: 0x8b5cf6, pos: [0, -60, 30] },
        { id: 'mod-deepseek', name: 'DeepSeek-R1 Local Air-Gapped', tier: 'Tier-3 Air-Gapped', latency: '45ms', cost: '$0.00/M', color: 0xf59e0b, pos: [0, 65, -30] },
      ];

      models.forEach((m) => {
        nodeMap.set(m.id, {
          id: m.id,
          name: m.name,
          type: 'model',
          status: 'ACTIVE',
          latency: m.latency,
          cost: m.cost,
          role: m.tier,
          colorHex: m.color,
          radius: 11,
          position: new THREE.Vector3(...m.pos as [number, number, number]),
          targetPosition: new THREE.Vector3(...m.pos as [number, number, number]),
          pulsePhase: Math.random() * Math.PI,
        });

        linkList.push({
          sourceId: 'neiman-core',
          targetId: m.id,
          type: 'routing',
          colorHex: m.color,
          curvature: 0.2,
          activityLevel: 1,
        });
      });
    } else if (activeMode === 'RESOURCE_FLOW') {
      // Compute nodes & capital allocation pipelines
      const pools = [
        { id: 'res-compute', name: 'Compute Enclave CGroup', status: `${resources.compute_used_pct ?? 28}% Allocated`, color: 0x06b6d4, pos: [-60, -20, 0] },
        { id: 'res-capital', name: 'Capital Budget Pool', status: `$${((resources.budget_spent_usd ?? 0) / 1000).toFixed(1)}k Spent`, color: 0x10b981, pos: [60, -20, 0] },
        { id: 'res-tokens', name: 'Token Velocity Stream', status: `${((resources.token_usage_total ?? 42800) / 1000).toFixed(1)}k Ingested`, color: 0x8b5cf6, pos: [0, 60, 20] },
      ];

      pools.forEach((p) => {
        nodeMap.set(p.id, {
          id: p.id,
          name: p.name,
          type: 'department',
          status: p.status,
          colorHex: p.color,
          radius: 13,
          position: new THREE.Vector3(...p.pos as [number, number, number]),
          targetPosition: new THREE.Vector3(...p.pos as [number, number, number]),
          pulsePhase: 1,
        });

        linkList.push({
          sourceId: 'neiman-core',
          targetId: p.id,
          type: 'data',
          colorHex: p.color,
          curvature: 0.15,
          activityLevel: 1,
        });
      });
    } else if (activeMode === 'MEMORY_GRAPH') {
      // Knowledge Graph Triples
      const triples = [
        { s: 'Architecture Council', p: 'enacted_adr', o: 'gRPC Microservices', color: 0x06b6d4 },
        { s: 'Security Sentinel', p: 'verified_boundary', o: 'Docker Sandbox', color: 0x10b981 },
        { s: 'Chief Architect', p: 'assigned_task', o: 'Consensus Quorum', color: 0x8b5cf6 },
        { s: 'Intelligence Router', p: 'routed_fallback', o: 'DeepSeek Local', color: 0xf59e0b },
      ];

      triples.forEach((tr, i) => {
        const angle = (i / triples.length) * Math.PI * 2;
        const sId = `mem-s-${i}`;
        const oId = `mem-o-${i}`;

        const sx = Math.cos(angle) * 55;
        const sy = Math.sin(angle) * 20;
        const sz = Math.sin(angle) * 55;

        const ox = Math.cos(angle + 0.3) * 85;
        const oy = Math.sin(angle) * -25;
        const oz = Math.sin(angle + 0.3) * 85;

        nodeMap.set(sId, {
          id: sId,
          name: tr.s,
          type: 'memory',
          status: 'VERIFIED',
          colorHex: tr.color,
          radius: 7,
          position: new THREE.Vector3(sx, sy, sz),
          targetPosition: new THREE.Vector3(sx, sy, sz),
          pulsePhase: i,
        });

        nodeMap.set(oId, {
          id: oId,
          name: tr.o,
          type: 'memory',
          status: tr.p,
          colorHex: 0x00f2fe,
          radius: 6,
          position: new THREE.Vector3(ox, oy, oz),
          targetPosition: new THREE.Vector3(ox, oy, oz),
          pulsePhase: i + 0.5,
        });

        linkList.push({
          sourceId: sId,
          targetId: oId,
          type: 'data',
          colorHex: tr.color,
          curvature: 0.2,
          activityLevel: 0.8,
        });
        linkList.push({
          sourceId: 'neiman-core',
          targetId: sId,
          type: 'data',
          colorHex: 0x38bdf8,
          curvature: 0.1,
          activityLevel: 0.5,
        });
      });
    } else if (activeMode === 'EVOLUTION') {
      // Dynamic Mutation Field & Genetic Optimization Proposals
      const proposals = [
        { id: 'evo-1', name: 'ADR-42: Dynamic Cache Eviction', status: 'CANDIDATE', impact: '+34% Latency Reduction', color: 0xf59e0b, angle: 0 },
        { id: 'evo-2', name: 'ADR-43: Local Token Compression', status: 'VALIDATING', impact: '-22% API Capital Burn', color: 0x10b981, angle: (Math.PI * 2) / 3 },
        { id: 'evo-3', name: 'ADR-44: Autonomous Fallback Mesh', status: 'PROPOSED', impact: 'Zero Downtime Failover', color: 0x8b5cf6, angle: ((Math.PI * 2) / 3) * 2 },
      ];

      proposals.forEach((pr) => {
        const r = 70;
        const x = Math.cos(pr.angle) * r;
        const y = Math.sin(pr.angle * 2) * 25;
        const z = Math.sin(pr.angle) * r;

        nodeMap.set(pr.id, {
          id: pr.id,
          name: pr.name,
          type: 'evolution',
          status: pr.status,
          role: pr.impact,
          colorHex: pr.color,
          radius: 9,
          position: new THREE.Vector3(x, y, z),
          targetPosition: new THREE.Vector3(x, y, z),
          pulsePhase: Math.random() * Math.PI,
        });

        linkList.push({
          sourceId: 'neiman-core',
          targetId: pr.id,
          type: 'data',
          colorHex: pr.color,
          curvature: 0.3,
          activityLevel: 1,
        });
      });
    }

    return { nodes: nodeMap, links: linkList };
  }, [activeMode, agents, tasks, projects, resources]);

  nodesRef.current = nodes;
  linksRef.current = links;

  // Initialize Three.js Engine with Full Spatial Rendering & ACES Tone Mapping
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080b11, 0.0028);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 2000);
    camera.position.set(0, 30, 240);
    cameraRef.current = camera;

    // WebGL Renderer with High-Fidelity Color Pipelines
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient Starfield / Dust Field (1,800 Cosmic Background Points)
    const dustCount = 1800;
    const dustGeom = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 600;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 450;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 600;

      const c = Math.random() > 0.8 ? 0.00f2fe : 0.2;
      dustColors[i * 3] = 0.4;
      dustColors[i * 3 + 1] = 0.6;
      dustColors[i * 3 + 2] = 0.9;
    }

    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 1.2,
      color: 0x4f6b92,
      transparent: true,
      opacity: 0.35,
    });
    const dustPoints = new THREE.Points(dustGeom, dustMat);
    scene.add(dustPoints);

    // Groups for Dynamic Scene Elements
    const coreGroup = new THREE.Group();
    const nodesGroup = new THREE.Group();
    const linksGroup = new THREE.Group();
    const arcsGroup = new THREE.Group();
    scene.add(coreGroup);
    scene.add(nodesGroup);
    scene.add(linksGroup);
    scene.add(arcsGroup);

    // NEIMAN Center 3D Crystal Nucleus
    const coreGeom = new THREE.IcosahedronGeometry(14, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreGroup.add(coreMesh);

    // Inner Glowing Core Sphere
    const innerCoreGeom = new THREE.SphereGeometry(8, 24, 24);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeom, innerCoreMat);
    coreGroup.add(innerCoreMesh);

    // Orbital Energy Rings
    const ringGeom = new THREE.TorusGeometry(26, 0.4, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeom, ringMat);
    ring2.rotation.y = Math.PI / 4;
    ring2.scale.set(1.2, 1.2, 1.2);
    coreGroup.add(ring2);

    // Mouse Interaction, Pan & Rotation State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotX = 0;
    let rotY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        targetRotY += dx * 0.005;
        targetRotX += dy * 0.005;
        targetRotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Raycast to find hovered node
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const hitNodes: CoreNode[] = [];
      nodesRef.current.forEach((n) => {
        // Compute world distance to ray
        const nodeWorld = n.position.clone().applyEuler(new THREE.Euler(rotX, rotY, 0));
        const screenPos = nodeWorld.clone().project(camera);
        const sx = ((screenPos.x + 1) * rect.width) / 2;
        const sy = ((-screenPos.y + 1) * rect.height) / 2;

        const dist = Math.hypot(e.clientX - rect.left - sx, e.clientY - rect.top - sy);
        if (dist < n.radius + 14) {
          hitNodes.push(n);
        }
      });

      if (hitNodes.length > 0) {
        setHoveredNode(hitNodes[0]);
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredNode(null);
        setHoverPos(null);
        document.body.style.cursor = 'default';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      let closest: CoreNode | null = null;
      let closestDist = 999;

      nodesRef.current.forEach((n) => {
        const nodeWorld = n.position.clone().applyEuler(new THREE.Euler(rotX, rotY, 0));
        const screenPos = nodeWorld.clone().project(camera);
        const sx = ((screenPos.x + 1) * rect.width) / 2;
        const sy = ((-screenPos.y + 1) * rect.height) / 2;

        const dist = Math.hypot(e.clientX - rect.left - sx, e.clientY - rect.top - sy);
        if (dist < n.radius + 16 && dist < closestDist) {
          closestDist = dist;
          closest = n;
        }
      });

      if (closest) {
        onSelectNode(closest);
      } else {
        onSelectNode(null);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.15;
      camera.position.z = Math.max(120, Math.min(450, camera.position.z));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Node Meshes Cache
    const meshMap = new Map<string, THREE.Mesh>();
    const lineMap = new Map<string, THREE.Line>();

    // 60 FPS Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Smooth camera orientation damping
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;

      if (autoRotate && !isDragging) {
        targetRotY += 0.0018;
      }

      // Rotate central core
      coreMesh.rotation.y = time * 0.45;
      coreMesh.rotation.x = time * 0.25;
      ring1.rotation.z = time * 0.35;
      ring2.rotation.z = -time * 0.25;

      // Pulse central core
      const coreScale = 1.0 + Math.sin(time * 3) * 0.06;
      innerCoreMesh.scale.set(coreScale, coreScale, coreScale);

      // Synchronize dynamic nodes
      const activeNodes = nodesRef.current;
      const currentSelectedId = selectedIdRef.current;

      // Update or create node meshes
      activeNodes.forEach((node, id) => {
        let mesh = meshMap.get(id);
        if (!mesh) {
          const geom = new THREE.SphereGeometry(node.radius, 20, 20);
          const mat = new THREE.MeshBasicMaterial({
            color: node.colorHex,
            transparent: true,
            opacity: 0.9,
          });
          mesh = new THREE.Mesh(geom, mat);
          nodesGroup.add(mesh);
          meshMap.set(id, mesh);
        }

        // Selected / Hovered Highlight Pulse
        const isSelected = currentSelectedId === id;
        const isHovered = hoveredNode?.id === id;
        const targetScale = isSelected ? 1.45 : isHovered ? 1.25 : 1.0;
        mesh.scale.set(targetScale, targetScale, targetScale);

        // Update Position
        mesh.position.copy(node.position);
      });

      // Remove defunct node meshes
      meshMap.forEach((mesh, id) => {
        if (!activeNodes.has(id)) {
          nodesGroup.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          meshMap.delete(id);
        }
      });

      // Update Links Geometry
      linksGroup.clear();
      const currentLinks = linksRef.current;

      currentLinks.forEach((link) => {
        const src = activeNodes.get(link.sourceId);
        const tgt = activeNodes.get(link.targetId);
        if (src && tgt) {
          // Quadratic Bezier Curve for organic cognitive connectivity
          const midPoint = new THREE.Vector3()
            .addVectors(src.position, tgt.position)
            .multiplyScalar(0.5);
          midPoint.y += link.curvature * 40;

          const curve = new THREE.QuadraticBezierCurve3(src.position, midPoint, tgt.position);
          const points = curve.getPoints(24);
          const geom = new THREE.BufferGeometry().setFromPoints(points);

          const mat = new THREE.LineBasicMaterial({
            color: link.colorHex,
            transparent: true,
            opacity: 0.25 + Math.sin(time * 4 + link.curvature * 10) * 0.15,
          });

          const line = new THREE.Line(geom, mat);
          linksGroup.add(line);
        }
      });

      // Apply master orientation to all active scene groups
      nodesGroup.rotation.x = rotX;
      nodesGroup.rotation.y = rotY;
      linksGroup.rotation.x = rotX;
      linksGroup.rotation.y = rotY;
      coreGroup.rotation.x = rotX;
      coreGroup.rotation.y = rotY;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Responsive Canvas Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [autoRotate]);

  // Camera Reset Handler
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 30, 240);
    }
  }, []);

  return (
    <div className={`relative w-full h-full flex flex-col font-mono select-none overflow-hidden ${className}`}>
      {/* 1. TOP FLOATING MODE SELECTOR (7 Distinct Visualization Modes) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-lg border border-cyan-500/25 bg-background/80 backdrop-blur-xl shadow-2xl">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. CAMERA CONTROLS HUD OVERLAY */}
      <div className="absolute right-3 top-3 z-30 flex flex-col gap-1 p-1 rounded-md border border-border/40 bg-background/70 backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.z = Math.max(120, cameraRef.current.position.z - 25);
            }
          }}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.z = Math.min(450, cameraRef.current.position.z + 25);
            }
          }}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`p-1.5 rounded transition-colors ${
            autoRotate ? 'text-cyan-400 bg-cyan-500/10' : 'text-muted-foreground hover:bg-secondary'
          }`}
          title="Toggle Planetary Rotation"
        >
          <Compass className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Reset Camera Coordinates"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3. THREE.JS WEBGL RENDER CANVAS */}
      <div ref={mountRef} className="w-full flex-1 min-h-[380px] cursor-grab active:cursor-grabbing" />

      {/* 4. HOVER RAYCAST HUD POPUP */}
      {hoveredNode && hoverPos && (
        <div
          className="pointer-events-none absolute z-40 transform -translate-x-1/2 -translate-y-full pb-3 animate-fade-in"
          style={{ left: `${hoverPos.x}px`, top: `${hoverPos.y}px` }}
        >
          <div className="rounded-lg border border-cyan-500/40 bg-background/95 backdrop-blur-xl px-3 py-1.5 shadow-2xl font-mono text-left max-w-xs">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: `#${hoveredNode.colorHex.toString(16).padStart(6, '0')}` }}
              />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                {hoveredNode.type} · {hoveredNode.status}
              </span>
            </div>
            <p className="text-xs font-bold text-foreground truncate">{hoveredNode.name}</p>
            {hoveredNode.role && (
              <p className="text-[10px] text-cyan-400 mt-0.5">{hoveredNode.role}</p>
            )}
            {hoveredNode.latency && (
              <p className="text-[9px] text-muted-foreground">Latency: {hoveredNode.latency}</p>
            )}
            <div className="mt-1 pt-1 border-t border-border/40 text-[8px] text-muted-foreground flex justify-between">
              <span>Click to inspect</span>
              <span className="text-cyan-400">↵</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. BOTTOM TIMELINE SCRUBBER HUD */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-3 py-1.5 rounded-lg border border-border/50 bg-background/85 backdrop-blur-xl shadow-lg w-[92%] max-w-xl">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="p-1 rounded bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>

        <span className="text-[10px] font-bold text-cyan-400 whitespace-nowrap">
          {timelineMinutes === 0 ? 'LIVE TELEMETRY' : `T -${timelineMinutes}m`}
        </span>

        {/* Timeline Slider Track */}
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={timelineMinutes}
          onChange={(e) => onTimelineChange?.(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1 rounded-full bg-secondary"
        />

        <div className="flex items-center gap-1 text-[9px] text-muted-foreground whitespace-nowrap">
          <span>-60m</span>
          <span>·</span>
          <span className="text-emerald-400 font-bold">NOW</span>
        </div>
      </div>
    </div>
  );
}
