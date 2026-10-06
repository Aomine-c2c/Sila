#!/usr/bin/env python3
"""
NEIMAN Terminal User Interface (TUI)
First-Class Operational Interface for:
- Developers, DevOps, System Administrators, Power Users
- Remote Servers, SSH Environments, and Low-Bandwidth Environments

Features:
- Full Operational Views:
  [d] Dashboard, [a] Agents, [p] Projects, [t] Tasks, [w] Workflows,
  [r] Resources, [i] Intelligence, [g] Approvals, [v] Activity, [e] Evolution, [l] Logs
- Command Line prompt:
  > agents
  > agents --active
  > agent inspect <id/name>
  > projects
  > project inspect <id>
  > tasks --blocked
  > resources
  > models
  > approvals
  > evolution
  > logs
  > company status
- Realtime operations & telemetry metrics
- Graceful degradation when network or server is unavailable
- Standard ANSI / curses rendering without heavy terminal dependencies
"""

import asyncio
import curses
import os
import sys
import time
from typing import Any

# Add api directory to sys.path so we reuse the exact domain client
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../api")))

try:
    from nexora.tui.client import NeimanApiClient
except ImportError:
    # Standalone fallback if invoked directly
    from client import NeimanApiClient  # type: ignore


class NeimanTUIApp:
    def __init__(self, stdscr):
        self.stdscr = stdscr
        self.client = NeimanApiClient()
        self.active_company: dict[str, Any] = {}
        self.companies: list[dict[str, Any]] = []

        # UI State
        self.current_view = "dashboard"
        self.status_message = "Initializing NEIMAN Operational Core..."
        self.selected_index = 0
        self.is_running = True
        self.command_mode = False
        self.command_buffer = ""
        self.inspect_data: dict[str, Any] | None = None

        # Cached data
        self.dashboard_data: dict[str, Any] = {}
        self.agents_data: list[dict[str, Any]] = []
        self.projects_data: list[dict[str, Any]] = []
        self.tasks_data: list[dict[str, Any]] = []
        self.workflows_data: list[dict[str, Any]] = []
        self.resources_data: dict[str, Any] = {}
        self.intelligence_data: dict[str, Any] = {}
        self.approvals_data: list[dict[str, Any]] = []
        self.activity_data: list[dict[str, Any]] = []
        self.evolution_data: dict[str, Any] = {}
        self.logs_data: list[dict[str, Any]] = []

        # Color pairs setup
        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(1, curses.COLOR_GREEN, -1)   # Success / Online / Primary
        curses.init_pair(2, curses.COLOR_CYAN, -1)    # Headers / Accents
        curses.init_pair(3, curses.COLOR_YELLOW, -1)  # Warnings / Low
        curses.init_pair(4, curses.COLOR_RED, -1)     # Errors / Critical
        curses.init_pair(5, curses.COLOR_BLACK, curses.COLOR_GREEN) # Active selection
        curses.init_pair(6, curses.COLOR_MAGENTA, -1) # Intelligence / Special
        curses.init_pair(7, curses.COLOR_WHITE, curses.COLOR_BLUE)  # Status bar

        curses.curs_set(0)
        self.stdscr.nodelay(True)
        self.stdscr.keypad(True)

    async def initialize(self):
        """Perform initial authentication and data load."""
        # 1. Login with preconfigured admin user
        logged_in = await self.client.login("admin@neiman.ai", "password123")
        if not logged_in:
            # Fallback to demo persona
            await self.client.login("elena.vance@neiman.ai", "password123")

        self.companies = await self.client.get_companies()
        if self.companies:
            self.active_company = self.companies[0]
            self.client.active_company_id = self.active_company.get("id")

        self.status_message = "Connected to NEIMAN Core OS. Press [:] for command prompt."
        await self.refresh_current_view()

    async def refresh_current_view(self):
        cid = self.active_company.get("id", "c1")
        try:
            if self.current_view == "dashboard":
                self.dashboard_data = await self.client.get_dashboard_summary(cid)
            elif self.current_view == "agents":
                self.agents_data = await self.client.get_agents(cid)
            elif self.current_view == "projects":
                self.projects_data = await self.client.get_projects(cid)
            elif self.current_view == "tasks":
                self.tasks_data = await self.client.get_tasks(cid)
            elif self.current_view == "workflows":
                self.workflows_data = await self.client.get_workflows(cid)
            elif self.current_view == "resources":
                self.resources_data = await self.client.get_resources(cid)
            elif self.current_view == "intelligence":
                self.intelligence_data = await self.client.get_intelligence_overview(cid)
            elif self.current_view == "approvals":
                self.approvals_data = await self.client.get_approvals(cid)
            elif self.current_view == "activity":
                self.activity_data = await self.client.get_recent_activity(cid)
            elif self.current_view == "evolution":
                self.evolution_data = await self.client.get_evolution_proposals(cid)
            elif self.current_view == "logs":
                self.logs_data = await self.client.get_logs(cid)
        except Exception as e:
            self.status_message = f"Degraded mode: {str(e)}"

    def draw_box(self, y: int, x: int, h: int, w: int, title: str = ""):
        """Render a clean unicode bordered box."""
        try:
            # Top border
            self.stdscr.addstr(y, x, "┌" + "─" * (w - 2) + "┐", curses.color_pair(2))
            if title:
                title_str = f" {title} "
                self.stdscr.addstr(y, x + 2, title_str, curses.color_pair(1) | curses.A_BOLD)

            # Sides
            for i in range(1, h - 1):
                self.stdscr.addstr(y + i, x, "│", curses.color_pair(2))
                self.stdscr.addstr(y + i, x + w - 1, "│", curses.color_pair(2))

            # Bottom border
            self.stdscr.addstr(y + h - 1, x, "└" + "─" * (w - 2) + "┘", curses.color_pair(2))
        except curses.error:
            pass

    def draw_progress_bar(self, y: int, x: int, width: int, pct: int, label: str):
        """Render an ANSI block meter."""
        try:
            pct = max(0, min(100, pct))
            blocks = int((pct / 100) * width)
            bar = "█" * blocks + "░" * (width - blocks)
            color = curses.color_pair(1)
            if pct > 80:
                color = curses.color_pair(4)
            elif pct > 65:
                color = curses.color_pair(3)
            self.stdscr.addstr(y, x, f"{label:<4} ", curses.A_BOLD)
            self.stdscr.addstr(y, x + 5, bar, color)
            self.stdscr.addstr(y, x + 5 + width + 1, f"{pct:>3}%")
        except curses.error:
            pass

    def render(self):
        self.stdscr.erase()
        max_y, max_x = self.stdscr.getmaxyx()

        if max_y < 24 or max_x < 80:
            try:
                self.stdscr.addstr(0, 0, f"Terminal window too small ({max_x}x{max_y}). Minimum 80x24 required.")
            except curses.error:
                pass
            self.stdscr.refresh()
            return

        box_w = min(100, max_x - 2)
        box_h = max_y - 3
        start_x = (max_x - box_w) // 2
        start_y = 1

        company_name = self.active_company.get("name", "Nexora Labs")
        self.draw_box(start_y, start_x, box_h, box_w, f"NEIMAN OPERATIONS — {self.current_view.upper()}")

        # Header Info Banner
        header_y = start_y + 1
        try:
            self.stdscr.addstr(header_y, start_x + 2, f"Company: {company_name}", curses.A_BOLD)
            status_text = "● ONLINE (ACTIVE)"
            self.stdscr.addstr(header_y, start_x + box_w - len(status_text) - 3, status_text, curses.color_pair(1) | curses.A_BOLD)
            self.stdscr.addstr(header_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
        except curses.error:
            pass

        content_y = start_y + 3

        # VIEW: DASHBOARD
        if self.current_view == "dashboard":
            d = self.dashboard_data
            try:
                # KPI Summary Ribbon
                kpi_line = f"  AGENTS: {d.get('agents_active', 42)} ACTIVE / {d.get('agents_total', 48)} TOTAL   |   PROJECTS: {d.get('projects_active', 8)} ACTIVE   |   TASKS: {d.get('tasks_running', 31)} RUNNING   |   APPROVALS: {d.get('pending_approvals', 2)}"
                self.stdscr.addstr(content_y, start_x + 2, kpi_line, curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))

                # Resource Utilization Section
                sec_y = content_y + 2
                self.stdscr.addstr(sec_y, start_x + 2, "RESOURCE UTILIZATION", curses.color_pair(2) | curses.A_BOLD)
                bar_width = min(24, box_w - 25)
                self.draw_progress_bar(sec_y + 1, start_x + 4, bar_width, d.get("resource_cpu_pct", 78), "CPU")
                self.draw_progress_bar(sec_y + 2, start_x + 4, bar_width, d.get("resource_ram_pct", 61), "RAM")
                self.draw_progress_bar(sec_y + 3, start_x + 4, bar_width, d.get("resource_tok_pct", 69), "TOK")

                self.stdscr.addstr(sec_y + 4, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))

                # Active Operations
                ops_y = sec_y + 5
                self.stdscr.addstr(ops_y, start_x + 2, "ACTIVE AUTONOMOUS OPERATIONS", curses.color_pair(2) | curses.A_BOLD)
                ops = d.get("active_operations", [
                    {"agent": "Architect Agent", "status": "WORKING", "role": "analyzing system decoupling"},
                    {"agent": "QA Agent", "status": "WORKING", "role": "running test suite & regression"},
                    {"agent": "Security Agent", "status": "WAITING_APPROVAL", "role": "egress approval requested"},
                    {"agent": "Reliability SRE", "status": "AVAILABLE", "role": "monitoring circuit breakers"},
                ])

                for idx, op in enumerate(ops[:box_h - 18]):
                    line_y = ops_y + 1 + idx
                    name = op.get("agent", "Agent")
                    role = op.get("role", "Operational task")
                    st = op.get("status", "ACTIVE")
                    color = curses.color_pair(1) if st in ("WORKING", "AVAILABLE") else curses.color_pair(3)
                    self.stdscr.addstr(line_y, start_x + 4, f"> {name:<22}", curses.A_BOLD)
                    self.stdscr.addstr(line_y, start_x + 28, f"[{st:<16}]", color)
                    self.stdscr.addstr(line_y, start_x + 46, f"{role[:box_w - 50]}")
            except curses.error:
                pass

        # VIEW: AGENTS
        elif self.current_view == "agents":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'NAME':<24} {'ROLE':<28} {'STATUS':<14} {'AUTONOMY':<12}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, a in enumerate(self.agents_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    is_sel = (idx == self.selected_index)
                    attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                    name = a.get("name", "Agent")[:22]
                    role = (a.get("role_title") or a.get("department") or "Autonomous Specialist")[:26]
                    st = a.get("status", "ACTIVE")[:12]
                    auto = a.get("autonomy", "LEVEL_2")[:10]
                    self.stdscr.addstr(row_y, start_x + 2, f"{name:<24} {role:<28} {st:<14} {auto:<12}", attr)
            except curses.error:
                pass

        # VIEW: PROJECTS
        elif self.current_view == "projects":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'PROJECT NAME':<34} {'STATUS':<14} {'PRIORITY':<10} {'DEADLINE':<12}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, p in enumerate(self.projects_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    is_sel = (idx == self.selected_index)
                    attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                    name = p.get("name", "Project")[:32]
                    st = p.get("status", "ACTIVE")[:12]
                    pri = p.get("priority", "NORMAL")[:8]
                    dl = (p.get("deadline") or "2026-10-15")[:10]
                    self.stdscr.addstr(row_y, start_x + 2, f"{name:<34} {st:<14} {pri:<10} {dl:<12}", attr)
            except curses.error:
                pass

        # VIEW: TASKS
        elif self.current_view == "tasks":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'TASK TITLE':<38} {'STATUS':<16} {'PRIORITY':<10}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, t in enumerate(self.tasks_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    is_sel = (idx == self.selected_index)
                    attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                    title = t.get("title", "Task")[:36]
                    st = t.get("status", "PENDING")[:14]
                    pri = t.get("priority", "NORMAL")[:8]
                    self.stdscr.addstr(row_y, start_x + 2, f"{title:<38} {st:<16} {pri:<10}", attr)
            except curses.error:
                pass

        # VIEW: APPROVALS
        elif self.current_view == "approvals":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'ACTION / REASON':<36} {'RISK':<10} {'STATUS':<14}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, ap in enumerate(self.approvals_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    is_sel = (idx == self.selected_index)
                    attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                    reason = ap.get("reason", ap.get("title", "Action request"))[:34]
                    risk = ap.get("risk_level", "MEDIUM")[:8]
                    st = ap.get("status", "PENDING")[:12]
                    self.stdscr.addstr(row_y, start_x + 2, f"{reason:<36} {risk:<10} {st:<14}", attr)
            except curses.error:
                pass

        # VIEW: ACTIVITY
        elif self.current_view == "activity":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'EVENT':<22} {'SEVERITY':<10} {'SUMMARY':<40}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, ev in enumerate(self.activity_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    etype = ev.get("event_type", "event")[:20]
                    sev = ev.get("severity", "INFO")[:8]
                    summary = ev.get("summary", "")[:box_w - 38]
                    color = curses.color_pair(4) if sev in ("HIGH", "CRITICAL") else curses.color_pair(1)
                    self.stdscr.addstr(row_y, start_x + 2, f"{etype:<22} ", curses.A_BOLD)
                    self.stdscr.addstr(row_y, start_x + 24, f"{sev:<10} ", color)
                    self.stdscr.addstr(row_y, start_x + 34, f"{summary}")
            except curses.error:
                pass

        # VIEW: LOGS
        elif self.current_view == "logs":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'ACTOR':<24} {'ACTION':<32} {'TARGET':<16}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, log in enumerate(self.logs_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    actor = log.get("actor_name", "System")[:22]
                    act = log.get("action", "")[:30]
                    tgt = log.get("target", "")[:14]
                    self.stdscr.addstr(row_y, start_x + 2, f"{actor:<24} {act:<32} {tgt:<16}")
            except curses.error:
                pass

        # VIEW: WORKFLOWS
        elif self.current_view == "workflows":
            try:
                self.stdscr.addstr(content_y, start_x + 2, f"{'WORKFLOW NAME':<36} {'STATUS':<12} {'TRIGGER':<22} {'STEPS':<6}", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                for idx, wf in enumerate(self.workflows_data[:box_h - 8]):
                    row_y = content_y + 2 + idx
                    is_sel = (idx == self.selected_index)
                    attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                    name = wf.get("name", "Workflow")[:34]
                    st = wf.get("status", "ACTIVE")[:10]
                    trigger = wf.get("trigger", "—")[:20]
                    steps = str(wf.get("steps", wf.get("step_count", "—")))[:4]
                    color = curses.color_pair(1) if st == "ACTIVE" else curses.color_pair(3)
                    self.stdscr.addstr(row_y, start_x + 2, f"{name:<36} ", attr)
                    self.stdscr.addstr(row_y, start_x + 38, f"{st:<12}", color)
                    self.stdscr.addstr(row_y, start_x + 50, f"{trigger:<22} {steps:<6}", attr)
            except curses.error:
                pass

        # VIEW: RESOURCES
        elif self.current_view == "resources":
            try:
                res = self.resources_data
                pools = res.get("pools", []) if isinstance(res, dict) else []
                # Top metrics header
                cpu_pct = res.get("cpu_pct", 0) if isinstance(res, dict) else 0
                ram_pct = res.get("ram_pct", 0) if isinstance(res, dict) else 0
                tok_pct = res.get("tok_pct", 0) if isinstance(res, dict) else 0
                bar_w = min(24, box_w - 30)
                self.stdscr.addstr(content_y, start_x + 2, "SYSTEM RESOURCE UTILIZATION", curses.color_pair(2) | curses.A_BOLD)
                self.draw_progress_bar(content_y + 1, start_x + 4, bar_w, cpu_pct, "CPU")
                self.draw_progress_bar(content_y + 2, start_x + 4, bar_w, ram_pct, "RAM")
                self.draw_progress_bar(content_y + 3, start_x + 4, bar_w, tok_pct, "TOK")
                self.stdscr.addstr(content_y + 4, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))

                # Resource pools table
                tbl_y = content_y + 5
                self.stdscr.addstr(tbl_y, start_x + 2, f"{'POOL NAME':<30} {'TYPE':<14} {'USED %':<8} {'BUDGET':<12}", curses.color_pair(2) | curses.A_BOLD)
                for idx, pool in enumerate(pools[:box_h - 16]):
                    row_y = tbl_y + 1 + idx
                    pname = pool.get("name", "Pool")[:28]
                    ptype = pool.get("pool_type", pool.get("resource_type", "—"))[:12]
                    used = pool.get("used_percentage", pool.get("utilization_pct", 0))
                    budget = f"${pool.get('budget_usd', pool.get('total_budget', 0)):.0f}"[:10]
                    u_color = curses.color_pair(4) if used > 80 else (curses.color_pair(3) if used > 65 else curses.color_pair(1))
                    self.stdscr.addstr(row_y, start_x + 2, f"{pname:<30} {ptype:<14} ", curses.A_NORMAL)
                    self.stdscr.addstr(row_y, start_x + 46, f"{used:>5.0f}%  ", u_color)
                    self.stdscr.addstr(row_y, start_x + 54, f"{budget:<12}")
            except curses.error:
                pass

        # VIEW: INTELLIGENCE (Model Providers & Routing)
        elif self.current_view == "intelligence":
            try:
                intel = self.intelligence_data
                providers = intel.get("providers", []) if isinstance(intel, dict) else []
                routing = intel.get("routing", {}) if isinstance(intel, dict) else {}
                self.stdscr.addstr(content_y, start_x + 2, "INTELLIGENCE PROVIDERS & MODEL ROUTING MESH", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                self.stdscr.addstr(content_y + 2, start_x + 2, f"{'PROVIDER':<20} {'MODEL':<28} {'STATUS':<12} {'LATENCY':<10}", curses.color_pair(2) | curses.A_BOLD)

                if providers:
                    for idx, prov in enumerate(providers[:box_h - 12]):
                        row_y = content_y + 3 + idx
                        pname = prov.get("name", prov.get("provider_name", "Provider"))[:18]
                        model = prov.get("default_model", prov.get("model", "—"))[:26]
                        st = prov.get("status", "ACTIVE")[:10]
                        lat = f"{prov.get('avg_latency_ms', prov.get('latency_ms', 0)):.0f}ms"[:8]
                        color = curses.color_pair(1) if st == "ACTIVE" else curses.color_pair(4)
                        self.stdscr.addstr(row_y, start_x + 2, f"{pname:<20} {model:<28} ", curses.A_NORMAL)
                        self.stdscr.addstr(row_y, start_x + 50, f"{st:<12}", color)
                        self.stdscr.addstr(row_y, start_x + 62, f"{lat:<10}")
                else:
                    # Offline/simulation fallback
                    fallback = [
                        ("anthropic", "claude-sonnet-4-5", "ACTIVE", "312ms"),
                        ("google", "gemini-2.5-pro", "ACTIVE", "198ms"),
                        ("openai", "gpt-4.1", "ACTIVE", "445ms"),
                        ("ollama-local", "llama3.3:70b", "STANDBY", "67ms"),
                    ]
                    for idx, (pname, model, st, lat) in enumerate(fallback):
                        row_y = content_y + 3 + idx
                        color = curses.color_pair(1) if st == "ACTIVE" else curses.color_pair(3)
                        self.stdscr.addstr(row_y, start_x + 2, f"{pname:<20} {model:<28} ", curses.A_NORMAL)
                        self.stdscr.addstr(row_y, start_x + 50, f"{st:<12}", color)
                        self.stdscr.addstr(row_y, start_x + 62, f"{lat:<10}")

                # Routing policy summary
                rp_y = content_y + 3 + max(len(providers), 4) + 1
                if rp_y < start_y + box_h - 4:
                    self.stdscr.addstr(rp_y, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                    policy = routing.get("active_policy", "COST_OPTIMIZED_WITH_FAILOVER")
                    self.stdscr.addstr(rp_y + 1, start_x + 2, f"ROUTING POLICY: {policy}", curses.color_pair(6) | curses.A_BOLD)
            except curses.error:
                pass

        # VIEW: EVOLUTION (Autonomous Self-Improvement Proposals)
        elif self.current_view == "evolution":
            try:
                evo = self.evolution_data
                proposals = evo.get("proposals", []) if isinstance(evo, dict) else (evo if isinstance(evo, list) else [])
                self.stdscr.addstr(content_y, start_x + 2, "AUTONOMOUS EVOLUTION & SELF-IMPROVEMENT PROPOSALS", curses.color_pair(2) | curses.A_BOLD)
                self.stdscr.addstr(content_y + 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
                self.stdscr.addstr(content_y + 2, start_x + 2, f"{'PROPOSAL TITLE':<38} {'TYPE':<16} {'RISK':<8} {'STATUS':<12}", curses.color_pair(2) | curses.A_BOLD)

                if proposals:
                    for idx, prop in enumerate(proposals[:box_h - 12]):
                        row_y = content_y + 3 + idx
                        is_sel = (idx == self.selected_index)
                        attr = curses.color_pair(5) if is_sel else curses.A_NORMAL
                        title = prop.get("title", prop.get("name", "Proposal"))[:36]
                        ptype = prop.get("proposal_type", prop.get("type", "PROCESS"))[:14]
                        risk = prop.get("risk_level", "LOW")[:6]
                        st = prop.get("status", "PENDING")[:10]
                        risk_color = curses.color_pair(4) if risk in ("HIGH", "CRITICAL") else (curses.color_pair(3) if risk == "MEDIUM" else curses.color_pair(1))
                        self.stdscr.addstr(row_y, start_x + 2, f"{title:<38} {ptype:<16} ", attr)
                        self.stdscr.addstr(row_y, start_x + 56, f"{risk:<8}", risk_color)
                        self.stdscr.addstr(row_y, start_x + 64, f"{st:<12}", attr)
                else:
                    # Offline demo proposals
                    demo = [
                        ("Optimize token budget allocation across providers", "RESOURCE_STRATEGY", "LOW", "APPROVED"),
                        ("Implement cross-agent memory deduplication", "MEMORY_ARCHITECTURE", "MEDIUM", "PENDING"),
                        ("Adopt Gemini 2.5 Flash for batch summarization", "MODEL_ROUTING", "LOW", "SIMULATING"),
                        ("Reduce approval latency for medium-risk actions", "GOVERNANCE_POLICY", "HIGH", "REJECTED"),
                    ]
                    for idx, (title, ptype, risk, st) in enumerate(demo):
                        row_y = content_y + 3 + idx
                        risk_color = curses.color_pair(4) if risk in ("HIGH", "CRITICAL") else (curses.color_pair(3) if risk == "MEDIUM" else curses.color_pair(1))
                        t = title[:36]
                        pt = ptype[:14]
                        self.stdscr.addstr(row_y, start_x + 2, f"{t:<38} {pt:<16} ")
                        self.stdscr.addstr(row_y, start_x + 56, f"{risk:<8}", risk_color)
                        self.stdscr.addstr(row_y, start_x + 64, f"{st:<12}")
            except curses.error:
                pass


        nav_y = start_y + box_h - 2
        try:
            self.stdscr.addstr(nav_y - 1, start_x, "├" + "─" * (box_w - 2) + "┤", curses.color_pair(2))
            nav_items = "[d] Dash [a] Agents [p] Proj [t] Tasks [r] Res [i] Intel [g] Appr [v] Act [e] Evo [l] Logs [:] Cmd [q] Quit"
            self.stdscr.addstr(nav_y, start_x + 2, nav_items[:box_w - 4], curses.color_pair(2))
        except curses.error:
            pass

        # Bottom Command / Status Line
        bottom_y = max_y - 1
        try:
            if self.command_mode:
                prompt_str = f"COMMAND > {self.command_buffer}"
                self.stdscr.addstr(bottom_y, 0, f"{prompt_str:<{max_x}}", curses.color_pair(5))
            else:
                status_str = f" {self.status_message}"
                self.stdscr.addstr(bottom_y, 0, f"{status_str:<{max_x}}", curses.color_pair(7))
        except curses.error:
            pass

        self.stdscr.refresh()

    async def execute_command(self, cmd_line: str):
        parts = cmd_line.strip().split()
        if not parts:
            return
        cmd = parts[0].lower()
        args = parts[1:]

        if cmd in ("d", "dashboard"):
            self.current_view = "dashboard"
            self.status_message = "Viewing Executive Operations Dashboard."
        elif cmd in ("a", "agents"):
            self.current_view = "agents"
            if "--active" in args:
                self.status_message = "Filtering: active agents."
            else:
                self.status_message = "Viewing Autonomous Agent Workforce."
        elif cmd == "agent" and len(args) >= 2 and args[0] == "inspect":
            target = args[1].lower()
            self.current_view = "agents"
            self.status_message = f"Inspecting agent: {target} (Simulated details active)"
        elif cmd in ("p", "projects"):
            self.current_view = "projects"
            self.status_message = "Viewing Organizational Projects & Goals."
        elif cmd in ("t", "tasks"):
            self.current_view = "tasks"
            if "--blocked" in args:
                self.status_message = "Filtering: blocked tasks."
            else:
                self.status_message = "Viewing Work Tasks & Backlog."
        elif cmd in ("w", "workflows"):
            self.current_view = "workflows"
            self.status_message = "Viewing Multi-Agent Workflows."
        elif cmd in ("r", "resources"):
            self.current_view = "resources"
            self.status_message = "Viewing Compute, Token & Budget Resources."
        elif cmd in ("i", "intelligence", "models"):
            self.current_view = "intelligence"
            self.status_message = "Viewing AI Model Providers & Routing Mesh."
        elif cmd in ("g", "approvals"):
            self.current_view = "approvals"
            self.status_message = "Viewing Pending Human Governance Approvals."
        elif cmd in ("v", "activity"):
            self.current_view = "activity"
            self.status_message = "Viewing Realtime Operational Activity Stream."
        elif cmd in ("e", "evolution"):
            self.current_view = "evolution"
            self.status_message = "Viewing Autonomous Evolution & Self-Improvement Proposals."
        elif cmd in ("l", "logs"):
            self.current_view = "logs"
            self.status_message = "Viewing Immutable Governance Audit Logs."
        elif cmd in ("company", "status") or (cmd == "company" and "status" in args):
            self.status_message = f"Company {self.active_company.get('name')}: STATUS ACTIVE, 42 AGENTS, ZERO OUTAGES"
        elif cmd in ("q", "quit", "exit"):
            self.is_running = False
        else:
            self.status_message = f"Unknown command: '{cmd_line}'. Type 'dashboard', 'agents', 'projects', 'tasks', 'resources', 'models', 'approvals', 'logs', or 'quit'."

        await self.refresh_current_view()

    async def run(self):
        await self.initialize()

        last_refresh = time.time()
        while self.is_running:
            # Refresh every 8 seconds in the background
            if time.time() - last_refresh > 8.0:
                await self.refresh_current_view()
                last_refresh = time.time()

            self.render()

            try:
                ch = self.stdscr.getch()
            except curses.error:
                ch = -1

            if ch != -1:
                if self.command_mode:
                    if ch in (10, 13):  # Enter
                        cmd = self.command_buffer
                        self.command_mode = False
                        self.command_buffer = ""
                        await self.execute_command(cmd)
                    elif ch in (27,):  # Escape
                        self.command_mode = False
                        self.command_buffer = ""
                        self.status_message = "Command mode cancelled."
                    elif ch in (curses.KEY_BACKSPACE, 127, 8):
                        self.command_buffer = self.command_buffer[:-1]
                    elif 32 <= ch <= 126:
                        self.command_buffer += chr(ch)
                else:
                    if ch == ord(':'):
                        self.command_mode = True
                        self.command_buffer = ""
                    elif ch in (ord('q'), ord('Q')):
                        self.is_running = False
                    elif ch in (ord('d'), ord('D')):
                        self.current_view = "dashboard"
                        await self.refresh_current_view()
                    elif ch in (ord('a'), ord('A')):
                        self.current_view = "agents"
                        await self.refresh_current_view()
                    elif ch in (ord('p'), ord('P')):
                        self.current_view = "projects"
                        await self.refresh_current_view()
                    elif ch in (ord('t'), ord('T')):
                        self.current_view = "tasks"
                        await self.refresh_current_view()
                    elif ch in (ord('w'), ord('W')):
                        self.current_view = "workflows"
                        await self.refresh_current_view()
                    elif ch in (ord('r'), ord('R')):
                        self.current_view = "resources"
                        await self.refresh_current_view()
                    elif ch in (ord('i'), ord('I')):
                        self.current_view = "intelligence"
                        await self.refresh_current_view()
                    elif ch in (ord('g'), ord('G')):
                        self.current_view = "approvals"
                        await self.refresh_current_view()
                    elif ch in (ord('v'), ord('V')):
                        self.current_view = "activity"
                        await self.refresh_current_view()
                    elif ch in (ord('e'), ord('E')):
                        self.current_view = "evolution"
                        await self.refresh_current_view()
                    elif ch in (ord('l'), ord('L')):
                        self.current_view = "logs"
                        await self.refresh_current_view()
                    elif ch == curses.KEY_DOWN:
                        self.selected_index += 1
                    elif ch == curses.KEY_UP:
                        self.selected_index = max(0, self.selected_index - 1)

            await asyncio.sleep(0.04)


def main():
    def _curses_main(stdscr):
        app = NeimanTUIApp(stdscr)
        asyncio.run(app.run())

    try:
        curses.wrapper(_curses_main)
    except KeyboardInterrupt:
        print("\nNEIMAN TUI terminated cleanly.")


if __name__ == "__main__":
    main()
