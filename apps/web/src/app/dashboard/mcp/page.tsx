'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Globe,
  Compass,
  Play,
  Flame,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Plus,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { useOrganizationContext } from '@/lib/organizationContext';
import {
  mcpApi,
  MCPServerConfig,
  MCPToolCallResult,
  MCPToolSchema,
} from '@/lib/api/mcp';

const CATEGORY_ICONS: Record<string, any> = {
  research: Search,
  browser: Globe,
  crawler: Flame,
  generation: Sparkles,
  custom: Boxes,
};

const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  research: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  browser: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  crawler: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  generation: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  custom: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

export default function MCPServersPage() {
  const activeCompany = useOrganizationContext();
  const companyId = activeCompany?.id || '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'servers' | 'playground' | 'register'>('servers');
  const [selectedServerId, setSelectedServerId] = useState<string>('perplexity');
  const [selectedToolName, setSelectedToolName] = useState<string>('perplexity_search');
  const [toolArgumentsJson, setToolArgumentsJson] = useState<string>(
    JSON.stringify({ query: 'High-performance distributed MCP systems' }, null, 2)
  );
  const [toolResult, setToolResult] = useState<MCPToolCallResult | null>(null);

  // New Server Form State
  const [newServerId, setNewServerId] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerDesc, setNewServerDesc] = useState('');
  const [newServerTransport, setNewServerTransport] = useState<'stdio' | 'sse'>('sse');
  const [newServerEndpoint, setNewServerEndpoint] = useState('http://localhost:8999/sse');
  const [newServerToolsJson, setNewServerToolsJson] = useState<string>(
    JSON.stringify(
      [
        {
          name: 'custom_inspect',
          description: 'Inspect remote resource telemetry',
          input_schema: { type: 'object', properties: { target: { type: 'string' } } },
        },
      ],
      null,
      2
    )
  );

  // Query: Servers
  const { data: servers = [], isLoading, refetch } = useQuery({
    queryKey: ['mcp-servers', companyId],
    queryFn: () => mcpApi.listServers(companyId),
    enabled: !!companyId,
    refetchInterval: 10000,
  });

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ serverId, isEnabled }: { serverId: string; isEnabled: boolean }) =>
      mcpApi.toggleServer(companyId, serverId, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers', companyId] });
    },
  });

  // Call Tool Mutation
  const callToolMutation = useMutation({
    mutationFn: async () => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolArgumentsJson);
      } catch (e) {
        throw new Error('Invalid JSON in arguments field');
      }
      return mcpApi.callTool(companyId, {
        server_id: selectedServerId,
        tool_name: selectedToolName,
        arguments: args,
      });
    },
    onSuccess: (data) => {
      setToolResult(data);
    },
  });

  // Register Server Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      let parsedTools: MCPToolSchema[] = [];
      try {
        parsedTools = JSON.parse(newServerToolsJson);
      } catch (e) {
        throw new Error('Invalid JSON in tools definition');
      }

      const newConfig: MCPServerConfig = {
        id: newServerId.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name: newServerName,
        description: newServerDesc,
        category: 'custom',
        transport: newServerTransport,
        endpoint: newServerEndpoint,
        env_keys_required: [],
        is_enabled: true,
        tools: parsedTools,
      };

      return mcpApi.registerServer(companyId, newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-servers', companyId] });
      setActiveTab('servers');
    },
  });

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  const handleSelectServerAndTool = (serverId: string, tool: MCPToolSchema) => {
    setSelectedServerId(serverId);
    setSelectedToolName(tool.name);

    // Pre-populate sensible sample args based on schema
    const sample: Record<string, any> = {};
    const props = (tool.input_schema?.properties as Record<string, any>) || {};
    for (const [key, val] of Object.entries(props)) {
      if (val.type === 'string') {
        sample[key] = key === 'url' ? 'https://docs.neiman.ai' : `${key}_example_value`;
      } else if (val.type === 'boolean') {
        sample[key] = false;
      } else if (val.type === 'integer') {
        sample[key] = 10;
      }
    }
    setToolArgumentsJson(JSON.stringify(sample, null, 2));
    setActiveTab('playground');
  };

  const totalToolsCount = servers.reduce((acc, s) => acc + s.tools.length, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Boxes className="h-3.5 w-3.5" />
              Model Context Protocol (MCP) Runtime
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Universal MCP Tool Gateway
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Equip organizational agents with standard MCP capabilities: live internet research (Perplexity), visual workflows (Glif), browser control (Chrome DevTools & Playwright), and clean markdown scraping (Firecrawl).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2 text-xs font-medium text-foreground hover:bg-card hover:border-primary/40 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Refresh Servers
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Register MCP Server
            </button>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Connected Servers</span>
            <Boxes className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{servers.length}</div>
          <div className="text-[10px] text-emerald-400 font-mono">Perplexity, Glif, Chrome, Playwright, Firecrawl</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Available Tools</span>
            <Terminal className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{totalToolsCount}</div>
          <div className="text-[10px] text-muted-foreground">Discovered JSON-RPC tool schemas</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Security Sandbox</span>
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">Active</div>
          <div className="text-[10px] text-emerald-400">SSRF and Metadata Egress Blocked</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Protocol Version</span>
            <Code2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">MCP 1.0</div>
          <div className="text-[10px] text-muted-foreground">JSON-RPC 2.0 / stdio / sse</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('servers')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'servers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Boxes className="h-4 w-4" />
          Registered MCP Servers ({servers.length})
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'playground'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Terminal className="h-4 w-4" />
          Tool Execution Playground
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'register'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Custom Server
        </button>
      </div>

      {/* TAB 1: REGISTERED SERVERS */}
      {activeTab === 'servers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => {
            const Icon = CATEGORY_ICONS[server.category] || Boxes;
            const badge = CATEGORY_BADGES[server.category] || CATEGORY_BADGES.custom;

            return (
              <div
                key={server.id}
                className={`rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all duration-200 ${
                  server.is_enabled ? 'border-border' : 'border-border/50 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{server.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${badge.bg} ${badge.text} ${badge.border} uppercase`}
                          >
                            {server.category}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {server.transport}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleMutation.mutate({ serverId: server.id, isEnabled: !server.is_enabled })
                      }
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                        server.is_enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                      }`}
                    >
                      {server.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {server.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="text-[11px] font-medium text-foreground block">
                      Exposed Tools ({server.tools.length}):
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {server.tools.map((tool) => (
                        <div
                          key={tool.name}
                          onClick={() => handleSelectServerAndTool(server.id, tool)}
                          className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/80 hover:border-primary/50 cursor-pointer transition-colors group"
                        >
                          <div>
                            <span className="font-mono text-xs text-foreground group-hover:text-primary">
                              {tool.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground block line-clamp-1">
                              {tool.description}
                            </span>
                          </div>
                          <Play className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {server.env_keys_required.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Keys:</span>
                    <div className="flex gap-1 flex-wrap">
                      {server.env_keys_required.map((k) => (
                        <code key={k} className="px-1 py-0.5 rounded bg-muted font-mono">
                          {k}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TOOL PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Interactive MCP Tool Runner
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Select MCP Server</label>
                <select
                  value={selectedServerId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedServerId(sid);
                    const s = servers.find((srv) => srv.id === sid);
                    if (s && s.tools.length > 0) {
                      handleSelectServerAndTool(sid, s.tools[0]);
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                >
                  {servers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Select Tool</label>
                <select
                  value={selectedToolName}
                  onChange={(e) => {
                    const tName = e.target.value;
                    const tool = selectedServer?.tools.find((t) => t.name === tName);
                    if (tool) {
                      handleSelectServerAndTool(selectedServerId, tool);
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                >
                  {selectedServer?.tools.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Tool Parameters (JSON Schema format)
              </label>
              <textarea
                rows={6}
                value={toolArgumentsJson}
                onChange={(e) => setToolArgumentsJson(e.target.value)}
                className="w-full rounded-lg border border-border bg-zinc-950 p-3 font-mono text-xs text-zinc-100 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => callToolMutation.mutate()}
                disabled={callToolMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {callToolMutation.isPending ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    Executing via MCP Gateway...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Dispatch Tool Call
                  </>
                )}
              </button>
            </div>

            {/* Execution Result Output Console */}
            {toolResult && (
              <div className="mt-4 rounded-xl border border-border bg-zinc-950 p-4 space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">STATUS:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        toolResult.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : toolResult.status === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {toolResult.status}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">SERVER:</span>
                    <span className="text-zinc-200">{toolResult.server_id}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">TOOL:</span>
                    <span className="text-zinc-200">{toolResult.tool_name}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">LATENCY:</span>
                    <span className="text-zinc-200">{toolResult.duration_ms}ms</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">ID: {toolResult.call_id}</div>
                </div>

                {toolResult.error_message && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300">
                    <span className="font-semibold block mb-0.5">GATEWAY / SANDBOX FAULT:</span>
                    {toolResult.error_message}
                  </div>
                )}

                <div>
                  <span className="text-zinc-400 block mb-1">MCP CONTENT PAYLOAD:</span>
                  <div className="space-y-2">
                    {toolResult.content.map((item, idx) => (
                      <pre
                        key={idx}
                        className="rounded bg-black/60 p-3 text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-64 text-[11px]"
                      >
                        {item.text || JSON.stringify(item, null, 2)}
                      </pre>
                    ))}
                  </div>
                </div>

                {toolResult.raw_output && (
                  <div>
                    <span className="text-zinc-400 block mb-1">RAW STRUCTURED TELEMETRY:</span>
                    <pre className="rounded bg-black/60 p-3 text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-40 text-[10px]">
                      {JSON.stringify(toolResult.raw_output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTER CUSTOM SERVER */}
      {activeTab === 'register' && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Connect Custom Model Context Protocol Server
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Server ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. enterprise_jira_mcp"
                  value={newServerId}
                  onChange={(e) => setNewServerId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Jira MCP"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <input
                type="text"
                placeholder="What capabilities does this MCP server provide?"
                value={newServerDesc}
                onChange={(e) => setNewServerDesc(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Transport Layer</label>
                <select
                  value={newServerTransport}
                  onChange={(e) => setNewServerTransport(e.target.value as 'stdio' | 'sse')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="sse">Server-Sent Events (SSE HTTP)</option>
                  <option value="stdio">Standard I/O Process</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Endpoint / Command</label>
                <input
                  type="text"
                  value={newServerEndpoint}
                  onChange={(e) => setNewServerEndpoint(e.target.value)}
                  placeholder="http://localhost:8999/sse or npx -y @modelcontextprotocol/..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Tools JSON Schema Definition
              </label>
              <textarea
                rows={6}
                value={newServerToolsJson}
                onChange={(e) => setNewServerToolsJson(e.target.value)}
                className="w-full rounded-lg border border-border bg-zinc-950 p-3 font-mono text-xs text-zinc-100 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('servers')}
                className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registerMutation.isPending || !newServerId.trim()}
                className="rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Registering...' : 'Register Server'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
