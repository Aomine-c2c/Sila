'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Sparkles,
  Bot,
  Building2,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Download,
  Upload,
  Copy,
  Plus,
  Play,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  Sliders,
  Settings,
  AlertTriangle,
  RotateCw,
  X,
  Check,
  ChevronDown,
  HelpCircle,
  Eye,
  FileCode,
  Zap,
  Bookmark,
  Share2,
  Crosshair,
  TrendingUp,
  Lock,
} from 'lucide-react';
import {
  blueprintsApi,
  CompanyBlueprint,
  BuildMyCompanyProposal,
  InstantiateBlueprintResponse,
} from '@/lib/api/blueprints';
import { useAuthStore } from '@/store/auth';

// Icons & category color mappings
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Technology: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'Finance & Capital': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Marketing & Creative': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Media & Entertainment': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  'Information Security': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Science & Academia': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Commerce & Retail': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Gaming & Interactive': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Infrastructure & Support': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'Education & Training': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'Heavy Industry & Mining': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

const AUTONOMY_LEVELS = [
  { level: 0, label: 'L0: Observe' },
  { level: 1, label: 'L1: Recommend' },
  { level: 2, label: 'L2: With Approval' },
  { level: 3, label: 'L3: Policy Constrained' },
  { level: 4, label: 'L4: Autonomous' },
  { level: 5, label: 'L5: Adaptive' },
];

export default function BlueprintsPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'build-my-company' | 'import-export'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Blueprint Inspection & Customization Modal State
  const [inspectBlueprint, setInspectBlueprint] = useState<CompanyBlueprint | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMission, setEditMission] = useState('');
  const [editAutonomy, setEditAutonomy] = useState(3);

  // Instantiation Modal State
  const [instantiateModalBp, setInstantiateModalBp] = useState<CompanyBlueprint | null>(null);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [instantiationSuccess, setInstantiationSuccess] = useState<InstantiateBlueprintResponse | null>(null);

  // Build My Company State & Modals
  const [promptText, setPromptText] = useState(
    'I want to create a software company that builds agricultural management systems for small farmers in Africa.'
  );
  const [targetBudget, setTargetBudget] = useState<number>(250);
  const [preferredAutonomy, setPreferredAutonomy] = useState<number>(3);
  const [proposal, setProposal] = useState<BuildMyCompanyProposal | null>(null);

  // Proposal In-Place Editing State
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [propEditName, setPropEditName] = useState('');
  const [propEditMission, setPropEditMission] = useState('');
  const [propEditBudget, setPropEditBudget] = useState<number>(250);
  const [propEditAutonomy, setPropEditAutonomy] = useState<number>(3);

  // Approval Gate Modal State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalName, setApprovalName] = useState('Founder & Managing Director');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);

  // Import State
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Save Company as Template State
  const activeCompany = useAuthStore((s) => s.activeCompany);
  const [templateName, setTemplateName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saveTemplateMsg, setSaveTemplateMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: blueprints = [], isLoading, refetch } = useQuery({
    queryKey: ['blueprints'],
    queryFn: () => blueprintsApi.listBlueprints(),
  });

  // Mutations
  const instantiateMutation = useMutation({
    mutationFn: ({ idOrKey, req }: { idOrKey: string; req: { company_name?: string } }) =>
      blueprintsApi.instantiateBlueprint(idOrKey, req),
    onSuccess: (data) => {
      setInstantiationSuccess(data);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => blueprintsApi.duplicateBlueprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blueprintsApi.updateBlueprint(id, data),
    onSuccess: (updated) => {
      setInspectBlueprint(updated);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      refetch();
    },
  });

  const buildMyCompanyMutation = useMutation({
    mutationFn: (req: { description: string; target_budget_monthly_usd?: number; preferred_autonomy_level?: number }) =>
      blueprintsApi.buildMyCompany(req),
    onSuccess: (data) => {
      setProposal(data);
      setPropEditName(data.proposed_blueprint?.name || '');
      setPropEditMission(data.proposed_blueprint?.company_definition?.mission || '');
      setPropEditBudget(data.estimated_operating_cost?.total_monthly_usd || 250);
      setPropEditAutonomy(data.proposed_blueprint?.default_autonomy || 3);
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: ({ proposalId, payload }: { proposalId: string; payload: any }) =>
      blueprintsApi.updateProposal(proposalId, payload),
    onSuccess: (data) => {
      setProposal(data);
      setIsEditingProposal(false);
    },
  });

  const simulateProposalMutation = useMutation({
    mutationFn: (proposalId: string) =>
      blueprintsApi.simulateProposal(proposalId, { test_workload_size: 30, concurrency_level: 5 }),
    onSuccess: (data) => {
      setProposal(data);
    },
  });

  const instantiateProposalMutation = useMutation({
    mutationFn: ({ proposalId, approver, companyName }: { proposalId: string; approver: string; companyName?: string }) =>
      blueprintsApi.instantiateProposal(proposalId, {
        approved_by: approver,
        confirmation_statement: 'Explicit human verification confirmed. Instantiating approved organizational blueprint.',
        custom_company_name: companyName,
      }),
    onSuccess: (data) => {
      setInstantiationSuccess(data);
      setShowApprovalModal(false);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (payload: any) => blueprintsApi.importBlueprint(payload),
    onSuccess: () => {
      setImportJsonText('');
      setImportError(null);
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      refetch();
      setActiveTab('catalog');
    },
    onError: (err: any) => {
      setImportError(err?.message || 'Failed to import blueprint JSON');
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (req: any) => blueprintsApi.saveAsTemplate(req),
    onSuccess: () => {
      setSaveTemplateMsg('Company successfully harvested and saved as reusable blueprint!');
      setTemplateName('');
      setTemplateKey('');
      setTemplateDesc('');
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      refetch();
    },
    onError: (err: any) => {
      setSaveTemplateMsg(`Error: ${err?.message || 'Failed to save template'}`);
    },
  });

  // Handlers
  const openInspect = (bp: CompanyBlueprint) => {
    setInspectBlueprint(bp);
    setEditName(bp.name);
    setEditMission(bp.company_definition?.mission || '');
    setEditAutonomy(bp.default_autonomy);
    setIsEditing(false);
  };

  const handleExport = async (bp: CompanyBlueprint) => {
    try {
      const data = await blueprintsApi.exportBlueprint(bp.id);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bp.key}_blueprint.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export blueprint');
    }
  };

  const handleImportSubmit = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      importMutation.mutate(parsed);
    } catch (e: any) {
      setImportError(`Invalid JSON format: ${e.message}`);
    }
  };

  // Filter Blueprints
  const categories = ['ALL', ...Array.from(new Set(blueprints.map((b) => b.category)))];
  const filteredBlueprints = blueprints.filter((bp) => {
    const matchesCategory = selectedCategory === 'ALL' || bp.category === selectedCategory;
    const matchesQuery =
      bp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.metadata_tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" />
            NEXORA Company Blueprints
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Instantiate preconfigured autonomous organizations or synthesize custom companies via natural language.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'catalog'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Catalog ({blueprints.length})
          </button>
          <button
            onClick={() => setActiveTab('build-my-company')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'build-my-company'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            Build My Company
          </button>
          <button
            onClick={() => setActiveTab('import-export')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'import-export'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import / Export / Template
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: BLUEPRINT CATALOG                                */}
      {/* ======================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-nexora-surface/60 border border-border p-3.5 rounded-xl">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search blueprints by name, tech stack, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/40 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mr-1" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Blueprints */}
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <RotateCw className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm">Loading NEXORA blueprint catalog...</p>
            </div>
          ) : filteredBlueprints.length === 0 ? (
            <div className="p-12 text-center bg-nexora-surface border border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No blueprints match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredBlueprints.map((bp) => {
                const catStyle = CATEGORY_COLORS[bp.category] || {
                  bg: 'bg-secondary/40',
                  text: 'text-foreground',
                  border: 'border-border',
                };
                return (
                  <div
                    key={bp.id}
                    className="flex flex-col justify-between bg-nexora-surface border border-border/80 hover:border-primary/50 transition-all rounded-xl p-5 shadow-sm hover:shadow-md group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                              {bp.name}
                            </h3>
                            <span
                              className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                            >
                              {bp.category}
                            </span>
                          </div>
                        </div>

                        {/* Autonomy Badge */}
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-secondary/80 text-foreground border border-border">
                            L{bp.default_autonomy} Autonomy
                          </span>
                        </div>
                      </div>

                      {/* Tagline & Description */}
                      <p className="text-xs font-medium text-foreground/90 line-clamp-1 mb-1.5">{bp.tagline}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {bp.description}
                      </p>

                      {/* Key Stats Bar */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-secondary/30 border border-border/50 mb-4 text-center">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Depts</div>
                          <div className="text-xs font-semibold text-foreground">{bp.departments?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Agents</div>
                          <div className="text-xs font-semibold text-foreground">{bp.agents?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase font-mono">Est. Cost</div>
                          <div className="text-xs font-semibold text-emerald-400">
                            ${Math.round(bp.estimated_monthly_cost_usd)}/mo
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {bp.metadata_tags && bp.metadata_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {bp.metadata_tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openInspect(bp)}
                          title="Inspect and Customize"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => duplicateMutation.mutate(bp.id)}
                          title="Duplicate Blueprint"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExport(bp)}
                          title="Export JSON Specification"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setInstantiateModalBp(bp);
                          setCustomCompanyName(bp.company_definition?.name || bp.name);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Instantiate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BUILD MY COMPANY (NATURAL LANGUAGE SYNTHESIS)     */}
      {/* ======================================================== */}
      {activeTab === 'build-my-company' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-nexora-surface to-background p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">BUILD MY COMPANY</h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Describe any business or organization in plain English. NEXORA will synthesize complete departments,
                  roles, specialized agents, workflows, operational policies, risk mitigations, and budget estimates for
                  your review before activation.
                </p>
              </div>
            </div>

            {/* Prompt Form */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Describe your organization & goals
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Build an autonomous venture capital syndication firm that monitors DeFi protocols, parses smart contract audits on GitHub, drafts investment memos, and alerts partners when APY exceeds 15% with TVL > $50M..."
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">Target Monthly Budget</span>
                    <span className="font-mono text-emerald-400 font-semibold">${targetBudget}/mo</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">Initial Autonomy Level</span>
                    <span className="font-mono text-primary font-semibold">Level {preferredAutonomy}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={preferredAutonomy}
                    onChange={(e) => setPreferredAutonomy(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
                    <span>L0: Observe</span>
                    <span>L3: Policy</span>
                    <span>L5: Adaptive</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={!promptText.trim() || buildMyCompanyMutation.isPending}
                  onClick={() =>
                    buildMyCompanyMutation.mutate({
                      description: promptText,
                      target_budget_monthly_usd: targetBudget,
                      preferred_autonomy_level: preferredAutonomy,
                    })
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-all shadow-md"
                >
                  {buildMyCompanyMutation.isPending ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      Synthesizing Organization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Synthesize Blueprint Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Proposal Review Section */}
          {proposal && (
            <div className="bg-nexora-surface border border-primary/40 rounded-2xl p-6 space-y-6 shadow-lg animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      proposal.status === 'INSTANTIATED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : proposal.status === 'SIMULATED'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {proposal.status === 'INSTANTIATED' ? 'INSTANTIATED LIVE' : proposal.status === 'SIMULATED' ? 'SIMULATION VALIDATED' : 'PROPOSED (PENDING REVIEW)'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">ID: {proposal.id.slice(0, 8)}...</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mt-1">
                    {proposal.proposed_blueprint?.name || 'Proposed Autonomous Organization'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {proposal.proposed_blueprint?.tagline || proposal.prompt}
                  </p>
                  <p className="text-xs italic text-primary/80 mt-1">
                    &ldquo;{proposal.proposed_blueprint?.company_definition?.mission}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditingProposal(!isEditingProposal);
                      if (!isEditingProposal) {
                        setPropEditName(proposal.proposed_blueprint?.name || '');
                        setPropEditMission(proposal.proposed_blueprint?.company_definition?.mission || '');
                        setPropEditBudget(proposal.estimated_operating_cost?.total_monthly_usd || 250);
                        setPropEditAutonomy(proposal.proposed_blueprint?.default_autonomy || 3);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-secondary/40 text-foreground transition-all"
                  >
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    {isEditingProposal ? 'Cancel Customization' : 'Modify Configuration'}
                  </button>

                  <button
                    disabled={simulateProposalMutation.isPending}
                    onClick={() => simulateProposalMutation.mutate(proposal.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all"
                  >
                    {simulateProposalMutation.isPending ? (
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Run Simulation
                  </button>

                  {proposal.status !== 'INSTANTIATED' && (
                    <button
                      onClick={() => setShowApprovalModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve & Instantiate
                    </button>
                  )}
                </div>
              </div>

              {/* In-Place Editing Panel */}
              {isEditingProposal && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <span className="font-bold text-primary font-mono uppercase tracking-wider">
                      Modify Proposed Organization
                    </span>
                    <span className="text-[10px] text-muted-foreground">Adjust parameters before approval</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold block mb-1">Company Name</label>
                      <input
                        type="text"
                        className="input text-xs"
                        value={propEditName}
                        onChange={(e) => setPropEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">Target Monthly Budget ($)</label>
                      <input
                        type="number"
                        className="input text-xs"
                        value={propEditBudget}
                        onChange={(e) => setPropEditBudget(Number(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="font-semibold block mb-1">Company Mission Statement</label>
                      <input
                        type="text"
                        className="input text-xs"
                        value={propEditMission}
                        onChange={(e) => setPropEditMission(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-primary/20">
                    <button
                      onClick={() => setIsEditingProposal(false)}
                      className="btn btn-outline text-xs h-8"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={updateProposalMutation.isPending}
                      onClick={() => {
                        const updatedBp = {
                          ...proposal.proposed_blueprint,
                          name: propEditName,
                          company_definition: {
                            ...proposal.proposed_blueprint?.company_definition,
                            name: propEditName,
                            mission: propEditMission,
                          },
                        };
                        updateProposalMutation.mutate({
                          proposalId: proposal.id,
                          payload: {
                            proposed_blueprint: updatedBp,
                            target_budget_monthly_usd: propEditBudget,
                            preferred_autonomy_level: propEditAutonomy,
                          },
                        });
                      }}
                      className="btn btn-primary text-xs h-8 gap-1.5"
                    >
                      {updateProposalMutation.isPending && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
                      Save Modifications
                    </button>
                  </div>
                </div>
              )}

              {/* 12-Step Synthesis Pipeline Progression Breadcrumbs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-2 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  12-Step Synthesis Pipeline Artifacts
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {[
                    'User Description',
                    'Requirement Analysis',
                    'Industry Identification',
                    'Organizational Design',
                    'Department Generation',
                    'Role Generation',
                    'Agent Generation',
                    'Workflow Generation',
                    'Policy Generation',
                    'Resource Model',
                    'Intelligence Requirements',
                    'Risk Analysis',
                  ].map((step, idx) => (
                    <span
                      key={step}
                      className="px-2 py-0.5 rounded-md bg-secondary/40 text-foreground border border-border/60 flex items-center gap-1"
                    >
                      <span className="text-primary font-bold">{idx + 1}.</span> {step}
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulation Lab Results Banner */}
              {proposal.simulation_results && (
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                    <span className="font-bold text-xs text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-indigo-400" />
                      Controlled Workload Simulation Results ({proposal.simulation_results.test_workload_size} Synthetic Tasks)
                    </span>
                    <span className="badge badge-warning text-[10px]">EXPERIMENTAL RESULTS ONLY</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                      <span className="text-[10px] text-muted-foreground block">TASKS PASSED</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {proposal.simulation_results.simulated_tasks_succeeded} / {proposal.simulation_results.test_workload_size}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                      <span className="text-[10px] text-muted-foreground block">AVG LATENCY</span>
                      <span className="font-bold text-cyan-400 text-sm">
                        {proposal.simulation_results.avg_latency_ms}ms
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                      <span className="text-[10px] text-muted-foreground block">TRIAL COST</span>
                      <span className="font-bold text-emerald-300 text-sm">
                        ${proposal.simulation_results.estimated_run_cost_usd}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-card/60 border border-border">
                      <span className="text-[10px] text-muted-foreground block">QUALITY BENCHMARK</span>
                      <span className="font-bold text-primary text-sm">
                        {proposal.simulation_results.quality_benchmark_pct}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-200/80 italic">
                    {proposal.simulation_results.dry_run_disclaimer}
                  </p>
                </div>
              )}

              {/* 1. Operating Cost Breakdown & Complexity */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    Resource & Operating Budget Breakdown
                  </h4>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Estimated Operational Complexity: <span className="font-bold text-amber-400">{proposal.estimated_operational_complexity}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground font-mono">Token Budget</span>
                    <div className="text-sm font-bold text-foreground">
                      ${proposal.estimated_operating_cost?.token_cost_usd ?? 100}/mo
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground font-mono">Compute & Storage</span>
                    <div className="text-sm font-bold text-foreground">
                      ${proposal.estimated_operating_cost?.compute_cost_usd ?? 50}/mo
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                    <span className="text-[10px] text-muted-foreground font-mono">Operational Slots</span>
                    <div className="text-sm font-bold text-foreground">
                      6 Concurrency Slots
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">Total Monthly Budget</span>
                    <div className="text-sm font-bold text-emerald-300">
                      ${proposal.estimated_operating_cost?.total_monthly_usd || 250}/mo
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Proposed Departments & Agents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    Generated Departments ({proposal.proposed_blueprint?.departments?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {proposal.proposed_blueprint?.departments?.map((dept: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                        <div className="text-xs font-semibold text-foreground">{dept.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{dept.purpose}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-primary" />
                    Generated Agents ({proposal.proposed_blueprint?.agents?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {proposal.proposed_blueprint?.agents?.map((agent: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{agent.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            L{agent.autonomy_level} Autonomy
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{agent.role_title}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                          {agent.system_instructions}
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-border/40 text-[9px] font-mono text-muted-foreground">
                          <span>Model: {agent.intelligence_config?.model || 'claude-3-5-sonnet'}</span>
                          <span>Tools: {agent.tools?.length || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Workflows & Policies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Generated Workflows ({proposal.proposed_blueprint?.workflows?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {proposal.proposed_blueprint?.workflows?.map((wf: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                        <div className="text-xs font-semibold text-foreground">{wf.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{wf.description}</div>
                        <div className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                          Stages: {wf.steps?.length || 0} ({wf.trigger_type})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-rose-400" />
                    Policies & Constitution
                  </h4>
                  <div className="space-y-2">
                    {proposal.proposed_blueprint?.policies?.map((pol: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{pol.name}</span>
                          <span className="text-[10px] font-mono text-rose-400">{pol.enforcement_level}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{pol.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Identified Operational Risks & Human Approval Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Potential Risks & Mitigations
                  </h4>
                  <div className="space-y-2">
                    {proposal.risks_identified?.map((risk: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                          <span>{risk.category}</span>
                          <span className="text-[10px] uppercase font-mono">{risk.severity}</span>
                        </div>
                        <p className="text-[11px] text-foreground mt-1">{risk.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <span className="font-semibold text-amber-400">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-emerald-400" />
                    Human Approval Requirements (Governance Gates)
                  </h4>
                  <div className="space-y-2">
                    {proposal.human_approval_requirements?.map((req: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                          <span>{req.gate}</span>
                          <span className="text-[10px] uppercase font-mono text-emerald-400">{req.required_authority}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{req.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Approve Action */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Governance Rule: Never silently creates an organization without human review and confirmation.
                </span>
                {proposal.status !== 'INSTANTIATED' && (
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Review, Approve & Instantiate Company
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: IMPORT / EXPORT / TEMPLATE                        */}
      {/* ======================================================== */}
      {activeTab === 'import-export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card 1: Import Blueprint */}
          <div className="bg-nexora-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Import Blueprint JSON</h3>
                <p className="text-xs text-muted-foreground">Load a custom organization blueprint specification.</p>
              </div>
            </div>

            <textarea
              rows={12}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Paste blueprint JSON definition here (must contain "key", "name", "company_definition", "departments", "agents")...'
              className="w-full font-mono text-[11px] bg-secondary/40 border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
            />

            {importError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {importError}
              </div>
            )}

            <button
              onClick={handleImportSubmit}
              disabled={!importJsonText.trim() || importMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors"
            >
              {importMutation.isPending ? <RotateCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import Blueprint
            </button>
          </div>

          {/* Card 2: Save Active Company as Template */}
          <div className="bg-nexora-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Save Company as Template</h3>
                <p className="text-xs text-muted-foreground">
                  Harvest active organization structure into a reusable blueprint.
                </p>
              </div>
            </div>

            {activeCompany ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30 border border-border text-xs">
                  <span className="text-muted-foreground">Active Organization:</span>{' '}
                  <span className="font-semibold text-foreground">{activeCompany.name}</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Template Key (Slug)</label>
                  <input
                    type="text"
                    placeholder="e.g. acme_holding_v1"
                    value={templateKey}
                    onChange={(e) => setTemplateKey(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Template Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Holding Custom Architecture"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Document the purpose of this template..."
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    className="w-full bg-secondary/40 border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {saveTemplateMsg && (
                  <div className="p-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground">
                    {saveTemplateMsg}
                  </div>
                )}

                <button
                  onClick={() =>
                    saveTemplateMutation.mutate({
                      company_id: activeCompany.id,
                      template_key: templateKey,
                      template_name: templateName,
                      description: templateDesc,
                    })
                  }
                  disabled={!templateKey.trim() || !templateName.trim() || saveTemplateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors"
                >
                  {saveTemplateMutation.isPending ? (
                    <RotateCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  Save As Reusable Template
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                Please select or create an active company first to harvest as a template.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: INSTANTIATION CONFIRMATION                      */}
      {/* ======================================================== */}
      {instantiateModalBp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-nexora-surface border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Play className="h-4 w-4 text-primary fill-current" />
                Instantiate {instantiateModalBp.name}
              </h3>
              <button
                onClick={() => setInstantiateModalBp(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This will create a new live, operational company in the database with{' '}
              <strong className="text-foreground">{instantiateModalBp.departments?.length || 0} departments</strong>,{' '}
              <strong className="text-foreground">{instantiateModalBp.agents?.length || 0} autonomous agents</strong>,
              standard workflows, constitutional governance policies, and initial resource budgets.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Company Name</label>
              <input
                type="text"
                value={customCompanyName}
                onChange={(e) => setCustomCompanyName(e.target.value)}
                placeholder="Enter organization name..."
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setInstantiateModalBp(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={instantiateMutation.isPending}
                onClick={() => {
                  instantiateMutation.mutate({
                    idOrKey: instantiateModalBp.key || instantiateModalBp.id,
                    req: { company_name: customCompanyName },
                  });
                  setInstantiateModalBp(null);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-colors shadow-sm"
              >
                {instantiateMutation.isPending ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Activate Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INSTANTIATION SUCCESS MODAL                    */}
      {/* ======================================================== */}
      {instantiationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-nexora-surface border border-emerald-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Company Instantiated Successfully!</h3>
                <p className="text-xs text-muted-foreground">The autonomous organization is now live and initialized.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 text-xs">
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                <span className="text-muted-foreground text-[10px] block">Company Name</span>
                <span className="font-bold text-foreground">{instantiationSuccess.company_name}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                <span className="text-muted-foreground text-[10px] block">Slug Identifier</span>
                <span className="font-mono text-primary">{instantiationSuccess.slug}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                <span className="text-muted-foreground text-[10px] block">Departments Created</span>
                <span className="font-bold text-foreground">{instantiationSuccess.departments_created}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
                <span className="text-muted-foreground text-[10px] block">Agents Activated</span>
                <span className="font-bold text-foreground">{instantiationSuccess.agents_created}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setInstantiationSuccess(null)}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: INSPECT & CUSTOMIZE DRAWER / MODAL             */}
      {/* ======================================================== */}
      {inspectBlueprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-nexora-surface border border-border rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-lg">{inspectBlueprint.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary font-mono text-muted-foreground">
                      v{inspectBlueprint.version}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inspectBlueprint.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Customize Blueprint
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateMutation.mutate({
                        id: inspectBlueprint.id,
                        data: {
                          name: editName,
                          company_definition: {
                            ...inspectBlueprint.company_definition,
                            mission: editMission,
                          },
                          default_autonomy: editAutonomy,
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save Customizations
                  </button>
                )}
                <button
                  onClick={() => setInspectBlueprint(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Customization Edit Fields (if editing) */}
            {isEditing && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="text-xs font-bold text-primary uppercase font-mono tracking-wider">
                  Customizing Blueprint Before Activation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Blueprint Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Default Autonomy (Level 0-5)
                    </label>
                    <select
                      value={editAutonomy}
                      onChange={(e) => setEditAutonomy(Number(e.target.value))}
                      className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      {AUTONOMY_LEVELS.map((al) => (
                        <option key={al.level} value={al.level}>
                          {al.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Company Mission</label>
                  <textarea
                    rows={2}
                    value={editMission}
                    onChange={(e) => setEditMission(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Blueprint Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Departments & Roles */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  Departments ({inspectBlueprint.departments?.length || 0})
                </h4>
                <div className="space-y-2">
                  {inspectBlueprint.departments?.map((dept, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                      <div className="text-xs font-semibold text-foreground">{dept.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{dept.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agents & Capabilities */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-primary" />
                  Configured Autonomous Agents ({inspectBlueprint.agents?.length || 0})
                </h4>
                <div className="space-y-2">
                  {inspectBlueprint.agents?.map((agent, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/20 border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{agent.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                          L{agent.autonomy_level}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        {agent.role_title} ({agent.department_name})
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                        {agent.system_instructions}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constitution & Governance Policies */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-400" />
                  Constitution & Prohibited Actions
                </h4>
                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Values</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {inspectBlueprint.constitution?.values?.map((v, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                      Prohibited Actions
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-rose-300/90 mt-1 space-y-0.5">
                      {inspectBlueprint.constitution?.prohibited_actions?.map((pa, i) => (
                        <li key={i}>{pa}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* KPIs & Approval Rules */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                  <Crosshair className="h-4 w-4 text-emerald-400" />
                  Target KPIs & Approval Gates
                </h4>
                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                      Key Performance Indicators
                    </span>
                    <div className="space-y-1 mt-1">
                      {inspectBlueprint.kpis?.map((kpi, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-foreground">{kpi.metric}</span>
                          <span className="font-mono text-emerald-400">{kpi.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Approval Gates</span>
                    <div className="space-y-1 mt-1">
                      {inspectBlueprint.approval_rules?.map((rule, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-foreground">{rule.operation}</span>
                          <span className="font-mono text-amber-400">{rule.risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                onClick={() => handleExport(inspectBlueprint)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Specification
              </button>

              <button
                onClick={() => {
                  setInstantiateModalBp(inspectBlueprint);
                  setCustomCompanyName(inspectBlueprint.company_definition?.name || inspectBlueprint.name);
                  setInspectBlueprint(null);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md"
              >
                <Play className="h-4 w-4 fill-current" />
                Instantiate Blueprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HUMAN APPROVAL CONFIRMATION MODAL                        */}
      {/* ======================================================== */}
      {showApprovalModal && proposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass rounded-2xl p-6 ring-1 ring-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-foreground">Human Approval & Activation Gate</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} className="btn btn-ghost h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                NEXORA Autonomous Safety Mandate
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                An AI organization is never silently instantiated from natural language. You are explicitly reviewing and authorizing
                the activation of <strong>{proposal.proposed_blueprint?.name}</strong> with {proposal.proposed_blueprint?.agents?.length || 3} autonomous employee agents,
                configured policies, and financial limits.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Company Name</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={propEditName || proposal.proposed_blueprint?.name || ''}
                  onChange={(e) => setPropEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Authorized Approver Name / Role</label>
                <input
                  type="text"
                  className="input text-xs"
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                  placeholder="e.g. Founder & Managing Director"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvalConfirmed}
                    onChange={(e) => setApprovalConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-border accent-emerald-500"
                  />
                  <span className="text-xs text-foreground leading-snug">
                    I confirm that I have reviewed the mission, generated departments, agents, workflows, policies, risk mitigations,
                    and dry-run simulation metrics for this organization.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="btn btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!approvalConfirmed || !approvalName || instantiateProposalMutation.isPending}
                onClick={() => {
                  instantiateProposalMutation.mutate({
                    proposalId: proposal.id,
                    approver: approvalName,
                    companyName: propEditName || proposal.proposed_blueprint?.name,
                  });
                }}
                className="btn btn-primary text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
              >
                {instantiateProposalMutation.isPending ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Authorize & Instantiate Real Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
