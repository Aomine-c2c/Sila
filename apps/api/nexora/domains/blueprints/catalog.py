"""
Preconfigured catalog of 10 industry organizational blueprints for NEXORA.

Blueprints included:
1. Software Development Company
2. Forex Trading Company
3. Marketing Agency
4. Social Media Company
5. Cybersecurity Company
6. Research Organization
7. E-commerce Company
8. Game Studio
9. IT Services Company
10. Education Organization
"""

SYSTEM_BLUEPRINTS = [
    # -------------------------------------------------------------
    # 1. SOFTWARE DEVELOPMENT COMPANY
    # -------------------------------------------------------------
    {
        "key": "software_development_company",
        "name": "Software Development Company",
        "tagline": "Autonomous Agile Product Engineering & Delivery",
        "description": "Full-lifecycle software engineering firm featuring product design, microservice architecture, QA automation, and continuous delivery.",
        "category": "Technology",
        "icon": "code",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 350.0,
        "metadata_tags": ["software", "devops", "engineering", "agile", "ai-native"],
        "company_definition": {
            "name": "NovaForge Technologies",
            "mission": "Deliver mission-critical resilient software systems through continuous AI-augmented engineering.",
            "vision": "Autonomous self-healing, self-optimizing cloud architecture.",
            "industry": "Software Engineering",
            "dna": {
                "operating_philosophy": "Continuous Integration, rigorous testing, and capability isolation",
                "innovation_level": "PROGRESSIVE",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "MODERATE",
                "quality_threshold": "EXCEPTIONAL",
                "decision_style": "CONSULTATIVE",
                "communication_style": "ASYNC_FIRST",
                "resource_strategy": "BALANCED",
            },
        },
        "departments": [
            {"name": "Product & Architecture", "purpose": "System specifications, requirements roadmapping, and domain modeling"},
            {"name": "Core Engineering", "purpose": "Frontend, backend, and distributed services development"},
            {"name": "Quality & Reliability", "purpose": "Automated regression testing, CI/CD pipelines, and SRE operations"},
        ],
        "roles": [
            {
                "department_name": "Product & Architecture",
                "title": "Lead Software Architect",
                "responsibilities": ["Define technical architecture", "Evaluate scalability tradeoffs", "Enforce clean design patterns"],
                "capabilities": ["architectural_reasoning", "system_design", "adr_synthesis"],
                "authority": "MANAGE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Core Engineering",
                "title": "Full Stack Engineer",
                "responsibilities": ["Implement REST/GraphQL endpoints", "Build responsive UI components", "Write unit tests"],
                "capabilities": ["code_generation", "refactoring", "debugging"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Quality & Reliability",
                "title": "Site Reliability Engineer",
                "responsibilities": ["Monitor latency and error rates", "Automate rollback procedures", "Enforce infrastructure guardrails"],
                "capabilities": ["log_analysis", "incident_remediation", "ci_cd_deployment"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Architect Agent",
                "role_title": "Lead Software Architect",
                "department_name": "Product & Architecture",
                "system_instructions": "Design maintainable, decoupled microservices. Prioritize asynchronous patterns and strict typing.",
                "responsibilities": ["Review technical proposals", "Enforce database normalization and indexing"],
                "capabilities": ["architectural_reasoning", "system_design"],
                "tools": [{"name": "repo_indexer", "description": "Index repo AST", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 15.0},
            },
            {
                "name": "Backend Engineer Agent",
                "role_title": "Full Stack Engineer",
                "department_name": "Core Engineering",
                "system_instructions": "Write performant Python/FastAPI code with SQLAlchemy 2.0 async and comprehensive test fixtures.",
                "responsibilities": ["Implement backend features", "Validate input schemas"],
                "capabilities": ["code_generation", "debugging"],
                "tools": [{"name": "test_runner", "description": "Run pytest suite", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 12.0},
            },
            {
                "name": "SRE Guard Agent",
                "role_title": "Site Reliability Engineer",
                "department_name": "Quality & Reliability",
                "system_instructions": "Maintain 99.99% uptime. Block unverified deployment artifacts. Escalate error spikes immediately.",
                "responsibilities": ["Monitor telemetry", "Execute canary rollouts"],
                "capabilities": ["log_analysis", "incident_remediation"],
                "tools": [{"name": "telemetry_probe", "description": "Poll health endpoints", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
        ],
        "workflows": [
            {
                "name": "Feature Delivery Pipeline",
                "description": "Specification -> Implementation -> Code Review -> Integration Testing -> Canary Deploy",
                "trigger_type": "EVENT",
                "steps": [
                    {"step_name": "Spec Validation", "agent": "Architect Agent"},
                    {"step_name": "Implementation", "agent": "Backend Engineer Agent"},
                    {"step_name": "Verification & Deploy", "agent": "SRE Guard Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Zero Untested Code Policy",
                "description": "All pull requests must contain unit tests covering altered lines.",
                "scope": "COMPANY",
                "rules": [{"condition": "test_coverage < 80%", "action": "BLOCK_PR"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Deliver rock-solid, verified software without manual toil.",
            "values": ["Engineering excellence", "Automated verification", "Data security"],
            "operating_principles": ["Never deploy unverified binaries", "Test continuously in staging first"],
            "prohibited_actions": ["Deploying directly to production without CI check", "Exposing API keys in public code repositories"],
            "approval_requirements": ["Production schema drops or destructive database migrations", "Altering master security policies"],
            "security_rules": ["All network traffic encrypted via TLS 1.3", "Zero secret retention in memory prompts"],
            "financial_rules": ["Cloud infrastructure cost alert threshold at $250/day"],
            "data_rules": ["Strict tenant isolation across storage buckets"],
            "autonomy_boundaries": {"deployment": "LEVEL_2", "code_authoring": "LEVEL_3"},
            "escalation_rules": ["Escalate build failures blocking main for over 30 minutes"],
        },
        "recommended_tools": [
            {"name": "git_adapter", "description": "Git pull/commit/push integration", "risk_level": "MEDIUM"},
            {"name": "pytest_executor", "description": "Test runner container", "risk_level": "LOW"},
            {"name": "docker_builder", "description": "Container image compiler", "risk_level": "MEDIUM"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["deep_coding", "architectural_reasoning", "fast_inference"],
            "recommended_models": ["claude-3-5-sonnet", "gpt-4o", "gemini-1.5-flash"],
        },
        "resource_policies": {
            "compute": {"cpu_cores": 8, "ram_gb": 16, "storage_gb": 100},
            "financial_budget_usd": 500.0,
            "execution_slots": 5,
        },
        "kpis": [
            {"name": "Deployment Frequency", "metric": "deploys_per_day", "target": ">= 4", "review_frequency": "WEEKLY"},
            {"name": "Mean Time to Recovery", "metric": "mttr_minutes", "target": "< 15", "review_frequency": "MONTHLY"},
        ],
        "approval_rules": [
            {"action": "PROD_DEPLOY", "condition": "target == 'production'", "approver_role": "ADMIN", "risk_level": "HIGH"}
        ],
        "escalation_rules": [
            {"trigger": "Test failure on release branch", "route_to": "Lead Software Architect", "severity": "HIGH", "sla_minutes": 15}
        ],
    },

    # -------------------------------------------------------------
    # 2. FOREX TRADING COMPANY
    # -------------------------------------------------------------
    {
        "key": "forex_trading_company",
        "name": "Forex Trading Company",
        "tagline": "Algorithmic Quantitative Currency Trading & Arbitrage",
        "description": "High-frequency macro and quantitative foreign exchange firm utilizing real-time volatility analysis, sentiment scoring, and strict risk guardrails.",
        "category": "Finance",
        "icon": "trending-up",
        "is_system_template": True,
        "default_autonomy": 2,
        "estimated_monthly_cost_usd": 650.0,
        "metadata_tags": ["finance", "forex", "trading", "quant", "risk-controlled"],
        "company_definition": {
            "name": "ApexFX Global Capital",
            "mission": "Execute disciplined, quantitative currency strategies with rigorous drawdown controls.",
            "vision": "Algorithmic market neutral returns across G10 and emerging currency pairs.",
            "industry": "Financial Services & Quant Trading",
            "dna": {
                "operating_philosophy": "Capital preservation first, systematic edge over emotional speculation",
                "innovation_level": "PROGRESSIVE",
                "autonomy_level": "BALANCED",
                "risk_tolerance": "CAUTIOUS",
                "quality_threshold": "PERFECT",
                "decision_style": "AUTHORITATIVE",
                "communication_style": "DIRECT",
                "resource_strategy": "INVEST_HEAVY",
            },
        },
        "departments": [
            {"name": "Quantitative Research", "purpose": "Market regime modeling, backtesting, and indicator generation"},
            {"name": "Execution & Trading", "purpose": "Order routing, latency optimization, and liquidity management"},
            {"name": "Risk Management & Compliance", "purpose": "VaR computation, drawdown limits, and margin monitoring"},
        ],
        "roles": [
            {
                "department_name": "Quantitative Research",
                "title": "Quant Alpha Researcher",
                "responsibilities": ["Identify statistical arbitrage opportunities", "Backtest mean-reversion signals"],
                "capabilities": ["time_series_analysis", "backtesting", "macroeconomic_reasoning"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Execution & Trading",
                "title": "Execution Algorithmic Trader",
                "responsibilities": ["Route limit orders", "Minimize slippage", "Manage FIX protocol connections"],
                "capabilities": ["order_routing", "slippage_optimization"],
                "authority": "EXECUTE",
                "autonomy_level": 2,
            },
            {
                "department_name": "Risk Management & Compliance",
                "title": "Chief Risk Officer Agent",
                "responsibilities": ["Monitor max daily drawdown", "Enforce leverage caps", "Halt runaway algorithms"],
                "capabilities": ["risk_modeling", "circuit_breaker_enforcement"],
                "authority": "FULL",
                "autonomy_level": 4,
            },
        ],
        "agents": [
            {
                "name": "Alpha Quant Agent",
                "role_title": "Quant Alpha Researcher",
                "department_name": "Quantitative Research",
                "system_instructions": "Analyze currency correlations, central bank rate curves, and COT reports. Propose probabilistic trade setups.",
                "responsibilities": ["Formulate trade hypotheses with strict risk-to-reward ratios"],
                "capabilities": ["time_series_analysis", "macroeconomic_reasoning"],
                "tools": [{"name": "market_feed_poller", "description": "FX tick data reader", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 12000, "max_daily_budget_usd": 20.0},
            },
            {
                "name": "Trade Execution Agent",
                "role_title": "Execution Algorithmic Trader",
                "department_name": "Execution & Trading",
                "system_instructions": "Execute approved trade signals only when spread and volatility metrics are within predefined thresholds.",
                "responsibilities": ["Execute orders", "Monitor fill rates"],
                "capabilities": ["order_routing"],
                "tools": [{"name": "broker_api_bridge", "description": "FIX protocol trading bridge", "risk_level": "HIGH"}],
                "autonomy_level": 2,
                "intelligence_config": {"model": "gemini-1.5-pro", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 25.0},
            },
            {
                "name": "Risk Sentry Agent",
                "role_title": "Chief Risk Officer Agent",
                "department_name": "Risk Management & Compliance",
                "system_instructions": "Enforce maximum 1.5% single-trade risk and 4% daily portfolio drawdown. Kill all open positions upon breach.",
                "responsibilities": ["Portfolio circuit breakers", "Margin compliance"],
                "capabilities": ["circuit_breaker_enforcement"],
                "tools": [{"name": "emergency_kill_switch", "description": "Flatten all broker positions", "risk_level": "CRITICAL"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 30.0},
            },
        ],
        "workflows": [
            {
                "name": "Signal to Execution Protocol",
                "description": "Quant Signal Generation -> Risk Parameter Verification -> Human/Manager Approval -> Order Routing",
                "trigger_type": "SCHEDULE",
                "steps": [
                    {"step_name": "Market Scan", "agent": "Alpha Quant Agent"},
                    {"step_name": "Risk Verification", "agent": "Risk Sentry Agent"},
                    {"step_name": "Order Execution", "agent": "Trade Execution Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Maximum Leverage Policy",
                "description": "Aggregate account leverage must never exceed 1:20 on major pairs and 1:10 on exotic pairs.",
                "scope": "COMPANY",
                "rules": [{"condition": "account_leverage > 20", "action": "HALT_TRADING"}],
                "enforcement_level": "ABSOLUTE",
            }
        ],
        "constitution": {
            "mission": "Maximize risk-adjusted returns while eliminating ruin scenarios through strict algorithmic governance.",
            "values": ["Capital protection", "Systematic discipline", "Zero emotional override"],
            "operating_principles": ["Never trade through tier-1 high impact news without manual review", "Honor stop losses without exception"],
            "prohibited_actions": ["Exceeding 2% single trade loss risk", "Disabling stop loss parameters", "Trading unapproved illiquid pairs"],
            "approval_requirements": ["Initial strategy capital allocation > $5,000", "Manual overnight position rollover exemptions"],
            "security_rules": ["API credentials stored in HSM vaults with IP whitelisting"],
            "financial_rules": ["Daily max loss circuit breaker at $1,000"],
            "data_rules": ["Tick logs preserved for 7 years regulatory compliance"],
            "autonomy_boundaries": {"order_placement": "LEVEL_2", "market_analysis": "LEVEL_3", "emergency_stop": "LEVEL_4"},
            "escalation_rules": ["Immediately notify Risk Officer on 3 consecutive losing trades in any single currency pair"],
        },
        "recommended_tools": [
            {"name": "meta_trader_gateway", "description": "MT5 / cTrader bridge", "risk_level": "HIGH"},
            {"name": "economic_calendar_feed", "description": "News volatility radar", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["fast_inference", "probabilistic_reasoning", "strict_precision"],
            "recommended_models": ["claude-3-5-sonnet", "gpt-4o", "gemini-1.5-flash"],
        },
        "resource_policies": {"financial_budget_usd": 1500.0, "execution_slots": 10},
        "kpis": [
            {"name": "Sharpe Ratio", "metric": "sharpe_ratio", "target": ">= 2.0", "review_frequency": "MONTHLY"},
            {"name": "Max Drawdown", "metric": "max_drawdown_pct", "target": "<= 5%", "review_frequency": "WEEKLY"},
        ],
        "approval_rules": [
            {"action": "LIVE_TRADE_ORDER", "condition": "lot_size > 1.0", "approver_role": "MANAGER", "risk_level": "HIGH"}
        ],
        "escalation_rules": [
            {"trigger": "Drawdown exceeds 3%", "route_to": "Chief Risk Officer Agent", "severity": "CRITICAL", "sla_minutes": 1}
        ],
    },

    # -------------------------------------------------------------
    # 3. MARKETING AGENCY
    # -------------------------------------------------------------
    {
        "key": "marketing_agency",
        "name": "Marketing Agency",
        "tagline": "Full-Funnel Growth Marketing, SEO & Creative Campaigns",
        "description": "Autonomous digital marketing agency driving client acquisition, ad creative production, organic search dominance, and multi-channel campaign automation.",
        "category": "Marketing & Creative",
        "icon": "megaphone",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 280.0,
        "metadata_tags": ["marketing", "seo", "copywriting", "growth", "creative"],
        "company_definition": {
            "name": "Vanguard Growth Agency",
            "mission": "Deliver measurable revenue growth for clients through hyper-personalized, data-driven multi-channel marketing campaigns.",
            "vision": "Autonomous creative ideation and performance marketing at scale.",
            "industry": "Marketing & Advertising",
            "dna": {
                "operating_philosophy": "Test rapidly, double down on what works, kill what doesn't",
                "innovation_level": "RADICAL",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "MODERATE",
                "quality_threshold": "HIGH",
                "decision_style": "CONSENSUS",
                "communication_style": "SEMI_FORMAL",
                "resource_strategy": "GROWTH",
            },
        },
        "departments": [
            {"name": "Strategy & SEO", "purpose": "Keyword research, competitor analysis, and organic traffic growth"},
            {"name": "Creative & Content Studio", "purpose": "Ad copy, landing pages, email drip sequences, and blog posts"},
            {"name": "Paid Acquisition", "purpose": "Ad spend optimization, A/B testing, and ROAS attribution"},
        ],
        "roles": [
            {
                "department_name": "Strategy & SEO",
                "title": "SEO Strategist",
                "responsibilities": ["Identify high-intent search queries", "Audit technical on-page SEO", "Construct topical authority clusters"],
                "capabilities": ["keyword_clustering", "competitive_analysis", "seo_audit"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Creative & Content Studio",
                "title": "Lead Copywriter",
                "responsibilities": ["Draft high-converting ad copy", "Create long-form thought leadership articles"],
                "capabilities": ["creative_writing", "persuasive_copywriting", "hook_generation"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Paid Acquisition",
                "title": "Performance Marketer",
                "responsibilities": ["Manage ad budgets", "Set up multi-variant creative tests", "Optimize cost per acquisition (CPA)"],
                "capabilities": ["ad_campaign_management", "cpa_optimization", "roas_analysis"],
                "authority": "MANAGE",
                "autonomy_level": 2,
            },
        ],
        "agents": [
            {
                "name": "SEO Analyst Agent",
                "role_title": "SEO Strategist",
                "department_name": "Strategy & SEO",
                "system_instructions": "Identify search demand gaps. Produce structured content briefs with semantic entity keywords.",
                "responsibilities": ["Generate keyword maps", "Analyze competitor search rankings"],
                "capabilities": ["keyword_clustering", "seo_audit"],
                "tools": [{"name": "serp_api_tool", "description": "Query Google search rankings", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.3},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 10.0},
            },
            {
                "name": "Copy Master Agent",
                "role_title": "Lead Copywriter",
                "department_name": "Creative & Content Studio",
                "system_instructions": "Craft compelling marketing copy adhering to brand voice and PAS (Problem-Agitate-Solve) frameworks.",
                "responsibilities": ["Write landing pages, email copy, and social hooks"],
                "capabilities": ["creative_writing", "persuasive_copywriting"],
                "tools": [{"name": "readability_analyzer", "description": "Score reading grade level", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.7},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 12.0},
            },
            {
                "name": "Ad Optimizer Agent",
                "role_title": "Performance Marketer",
                "department_name": "Paid Acquisition",
                "system_instructions": "Optimize PPC budgets. Allocate spend strictly to campaigns exceeding 2.5x ROAS targets.",
                "responsibilities": ["Bid adjustments", "A/B test reporting"],
                "capabilities": ["ad_campaign_management", "roas_analysis"],
                "tools": [{"name": "ads_manager_api", "description": "Google/Meta Ads API", "risk_level": "HIGH"}],
                "autonomy_level": 2,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 6144, "max_daily_budget_usd": 15.0},
            },
        ],
        "workflows": [
            {
                "name": "Campaign Launch Lifecycle",
                "description": "Keyword Research -> Brief Generation -> Copy Drafting -> Compliance Review -> Campaign Staging",
                "trigger_type": "MANUAL",
                "steps": [
                    {"step_name": "Research", "agent": "SEO Analyst Agent"},
                    {"step_name": "Drafting", "agent": "Copy Master Agent"},
                    {"step_name": "Review & Launch", "agent": "Ad Optimizer Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Brand Safety Policy",
                "description": "Never publish misleading claims or guarantees in customer-facing promotional copy.",
                "scope": "COMPANY",
                "rules": [{"condition": "contains_unverified_guarantee", "action": "REQUIRE_LEGAL_REVIEW"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Drive measurable growth while upholding strict advertising ethics and client trust.",
            "values": ["Data integrity", "Creative bravery", "Transparent attribution"],
            "operating_principles": ["Every claim must be provable", "Never waste ad spend on unvalidated landing pages"],
            "prohibited_actions": ["Deploying ad spend > $500 without client sign-off", "Purchasing deceptive bot followers or spam backlinks"],
            "approval_requirements": ["Live client ad launch", "Budget increases > 20% week-over-week"],
            "security_rules": ["Client analytics data must remain anonymized and isolated"],
            "financial_rules": ["Total monthly client ad commitments must not exceed approved retainer"],
            "data_rules": ["Adherence to GDPR and CCPA marketing consent directives"],
            "autonomy_boundaries": {"creative_generation": "LEVEL_4", "ad_spend_execution": "LEVEL_2"},
            "escalation_rules": ["Escalate campaign ROAS dropping below 1.5x to account manager immediately"],
        },
        "recommended_tools": [
            {"name": "google_analytics_bridge", "description": "GA4 metric pipeline", "risk_level": "LOW"},
            {"name": "meta_ads_bridge", "description": "Meta Graph API connection", "risk_level": "HIGH"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["creative_writing", "persuasive_copywriting", "fast_inference"],
            "recommended_models": ["gpt-4o", "gemini-1.5-flash"],
        },
        "resource_policies": {"financial_budget_usd": 400.0, "execution_slots": 6},
        "kpis": [
            {"name": "Client ROAS", "metric": "return_on_ad_spend", "target": ">= 3.0", "review_frequency": "WEEKLY"},
            {"name": "Organic Traffic Growth", "metric": "monthly_unique_visitors", "target": "+15% MoM", "review_frequency": "MONTHLY"},
        ],
        "approval_rules": [
            {"action": "AD_BUDGET_INCREASE", "condition": "amount > 500", "approver_role": "MANAGER", "risk_level": "HIGH"}
        ],
        "escalation_rules": [
            {"trigger": "Client churn warning flag", "route_to": "Account Director", "severity": "HIGH", "sla_minutes": 30}
        ],
    },

    # -------------------------------------------------------------
    # 4. SOCIAL MEDIA COMPANY
    # -------------------------------------------------------------
    {
        "key": "social_media_company",
        "name": "Social Media Company",
        "tagline": "Real-Time Viral Content Generation, Curation & Community Management",
        "description": "24/7 social presence network managing viral post scheduling, audience engagement, sentiment monitoring, and automated trend response.",
        "category": "Media & Entertainment",
        "icon": "share-2",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 220.0,
        "metadata_tags": ["social-media", "community", "viral", "content", "x-twitter", "linkedin"],
        "company_definition": {
            "name": "TrendWave Social Network",
            "mission": "Amplify brand voice and foster high-engagement global digital communities through timely cultural commentary and storytelling.",
            "vision": "Autonomous real-time digital culture coordination.",
            "industry": "Social Media & Community",
            "dna": {
                "operating_philosophy": "Speed, relevance, cultural awareness, and rapid feedback loops",
                "innovation_level": "RADICAL",
                "autonomy_level": "FULLY_AUTONOMOUS",
                "risk_tolerance": "MODERATE",
                "quality_threshold": "HIGH",
                "decision_style": "DELEGATIVE",
                "communication_style": "CASUAL",
                "resource_strategy": "GROWTH",
            },
        },
        "departments": [
            {"name": "Trend Intelligence", "purpose": "Monitoring real-time viral trends, memes, and cultural moments"},
            {"name": "Content Studio", "purpose": "Drafting threads, carousel scripts, and short-form video hooks"},
            {"name": "Community Care", "purpose": "Replying to comments, customer queries, and brand mentions"},
        ],
        "roles": [
            {
                "department_name": "Trend Intelligence",
                "title": "Trend Scout",
                "responsibilities": ["Monitor social feeds", "Score trending topic relevance", "Flag brand-aligned hashtags"],
                "capabilities": ["social_listening", "trend_forecasting"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Content Studio",
                "title": "Social Content Creator",
                "responsibilities": ["Write viral hooks", "Draft daily posting schedules", "Repurpose long-form content into punchy posts"],
                "capabilities": ["hook_crafting", "thread_writing", "visual_scripting"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Community Care",
                "title": "Community Moderator",
                "responsibilities": ["Respond to inbound DMs and replies", "De-escalate negative sentiment", "Engage with industry leaders"],
                "capabilities": ["sentiment_analysis", "empathetic_messaging", "deescalation"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Trend Scout Agent",
                "role_title": "Trend Scout",
                "department_name": "Trend Intelligence",
                "system_instructions": "Monitor Twitter/X and LinkedIn APIs for breakout conversations in tech, AI, and entrepreneurship.",
                "responsibilities": ["Feed trending topics to Content Studio"],
                "capabilities": ["social_listening"],
                "tools": [{"name": "trend_tracker", "description": "Social API trend listener", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.4},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
            {
                "name": "Post Generator Agent",
                "role_title": "Social Content Creator",
                "department_name": "Content Studio",
                "system_instructions": "Generate punchy, insightful social posts. Keep hooks under 100 characters. Avoid corporate jargon.",
                "responsibilities": ["Daily post generation"],
                "capabilities": ["hook_crafting", "thread_writing"],
                "tools": [{"name": "post_scheduler", "description": "Buffer/Hootsuite staging API", "risk_level": "MEDIUM"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.8},
                "resource_limits": {"max_tokens_per_call": 6144, "max_daily_budget_usd": 10.0},
            },
            {
                "name": "Community Responder Agent",
                "role_title": "Community Moderator",
                "department_name": "Community Care",
                "system_instructions": "Respond warmly and helpfully. Escalate serious complaints or public relations risks immediately.",
                "responsibilities": ["Reply to followers within 5 minutes"],
                "capabilities": ["sentiment_analysis", "deescalation"],
                "tools": [{"name": "reply_publisher", "description": "Publish reply to thread", "risk_level": "MEDIUM"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o-mini", "temperature": 0.3},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 6.0},
            },
        ],
        "workflows": [
            {
                "name": "Trend Response Workflow",
                "description": "Trend Discovery -> Angle Synthesis -> Draft Post -> Safety Check -> Post Publication",
                "trigger_type": "SCHEDULE",
                "steps": [
                    {"step_name": "Trend Discovery", "agent": "Trend Scout Agent"},
                    {"step_name": "Post Generation", "agent": "Post Generator Agent"},
                    {"step_name": "Community Ingestion", "agent": "Community Responder Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Social PR Guardrail Policy",
                "description": "Never take partisan political stances or publish unverified controversy.",
                "scope": "COMPANY",
                "rules": [{"condition": "contains_political_hotspot", "action": "BLOCK_POST"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Ignite meaningful digital community interactions with relentless positivity and wit.",
            "values": ["Authenticity", "Responsiveness", "Cultural empathy"],
            "operating_principles": ["Engage proactively", "Never argue with community members online"],
            "prohibited_actions": ["Publishing unauthorized client customer names", "Using copyright-infringing media"],
            "approval_requirements": ["Crisis communication statements", "Sponsored campaign activations"],
            "security_rules": ["Two-factor authentication mandatory on all connected social handles"],
            "financial_rules": ["Zero unapproved tool subscription purchases"],
            "data_rules": ["Private DM contents must never be fed into public LLM training datasets"],
            "autonomy_boundaries": {"trend_identification": "LEVEL_5", "reply_posting": "LEVEL_3"},
            "escalation_rules": ["Escalate negative sentiment spike > 30% in 1 hour to PR Director"],
        },
        "recommended_tools": [
            {"name": "social_scheduler_api", "description": "Posting engine", "risk_level": "MEDIUM"},
            {"name": "sentiment_filter", "description": "Toxicity and sentiment classifier", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["creative_writing", "fast_inference", "sentiment_analysis"],
            "recommended_models": ["gpt-4o", "gemini-1.5-flash", "gpt-4o-mini"],
        },
        "resource_policies": {"financial_budget_usd": 300.0, "execution_slots": 5},
        "kpis": [
            {"name": "Engagement Rate", "metric": "engagement_pct", "target": ">= 4.5%", "review_frequency": "WEEKLY"},
            {"name": "Average Reply Time", "metric": "response_time_minutes", "target": "< 10", "review_frequency": "DAILY"},
        ],
        "approval_rules": [
            {"action": "CRISIS_PR_STATEMENT", "condition": "pr_risk == true", "approver_role": "ADMIN", "risk_level": "CRITICAL"}
        ],
        "escalation_rules": [
            {"trigger": "Viral complaint post reaching 10k views", "route_to": "PR Communications Lead", "severity": "CRITICAL", "sla_minutes": 5}
        ],
    },

    # -------------------------------------------------------------
    # 5. CYBERSECURITY COMPANY
    # -------------------------------------------------------------
    {
        "key": "cybersecurity_company",
        "name": "Cybersecurity Company",
        "tagline": "Continuous Threat Intelligence, Vulnerability Scanning & SOC Automation",
        "description": "Defensive and offensive security organization providing 24/7 Security Operations Center (SOC) monitoring, CVE penetration analysis, and zero-trust policy enforcement.",
        "category": "Security & Defense",
        "icon": "shield",
        "is_system_template": True,
        "default_autonomy": 2,
        "estimated_monthly_cost_usd": 500.0,
        "metadata_tags": ["cybersecurity", "soc", "infosec", "threat-intel", "zero-trust"],
        "company_definition": {
            "name": "SentinX Cyber Defense",
            "mission": "Neutralize cyber threats and safeguard enterprise assets through relentless proactive security vigilance.",
            "vision": "Autonomous zero-trust threat detection and incident remediation.",
            "industry": "Information Security & Defense",
            "dna": {
                "operating_philosophy": "Zero trust, assume breach, verify continuously, automate defense",
                "innovation_level": "PROGRESSIVE",
                "autonomy_level": "GUIDED",
                "risk_tolerance": "RISK_AVERSE",
                "quality_threshold": "PERFECT",
                "decision_style": "AUTHORITATIVE",
                "communication_style": "FORMAL",
                "resource_strategy": "INVEST_HEAVY",
            },
        },
        "departments": [
            {"name": "Threat Intelligence", "purpose": "Hunting zero-days, monitoring dark web leaks, and tracking APT campaigns"},
            {"name": "Security Operations Center", "purpose": "SIEM log correlation, firewall rule validation, and alert triage"},
            {"name": "Vulnerability Assessment", "purpose": "Static code analysis, dependency CVE scanning, and penetration probing"},
        ],
        "roles": [
            {
                "department_name": "Threat Intelligence",
                "title": "Threat Intel Hunter",
                "responsibilities": ["Track CVE databases", "Extract IOCs (Indicators of Compromise)", "Map tactics to MITRE ATT&CK"],
                "capabilities": ["threat_intelligence", "ioc_extraction", "mitre_mapping"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Security Operations Center",
                "title": "SOC Tier 2 Analyst",
                "responsibilities": ["Triage SIEM alerts", "Isolate suspicious host instances", "Correlate intrusion attempts"],
                "capabilities": ["siem_correlation", "incident_triage", "forensics"],
                "authority": "MANAGE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Vulnerability Assessment",
                "title": "AppSec Auditor",
                "responsibilities": ["Run SAST and DAST scans", "Enforce software supply chain integrity", "Verify patch deployments"],
                "capabilities": ["vulnerability_scanning", "sast_audit", "remediation_advisory"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Threat Hunter Agent",
                "role_title": "Threat Intel Hunter",
                "department_name": "Threat Intelligence",
                "system_instructions": "Monitor NVD, CISA bulletins, and GitHub advisories. Alert on high-severity zero-day disclosures affecting stack.",
                "responsibilities": ["Daily threat briefing generation"],
                "capabilities": ["threat_intelligence", "ioc_extraction"],
                "tools": [{"name": "cve_nvd_feed", "description": "National Vulnerability Database API", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 10000, "max_daily_budget_usd": 15.0},
            },
            {
                "name": "SOC Analyst Agent",
                "role_title": "SOC Tier 2 Analyst",
                "department_name": "Security Operations Center",
                "system_instructions": "Analyze intrusion logs. When brute force or credential stuffing detected, immediately stage IP blocklist rule.",
                "responsibilities": ["SIEM log analysis and alerting"],
                "capabilities": ["siem_correlation", "incident_triage"],
                "tools": [{"name": "waf_ip_blocker", "description": "Add IP to firewall blocklist", "risk_level": "HIGH"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 18.0},
            },
            {
                "name": "Vulnerability Auditor Agent",
                "role_title": "AppSec Auditor",
                "department_name": "Vulnerability Assessment",
                "system_instructions": "Audit third-party dependencies. Fail builds containing CVEs with CVSS score >= 7.0.",
                "responsibilities": ["Software supply chain verification"],
                "capabilities": ["vulnerability_scanning", "sast_audit"],
                "tools": [{"name": "dependency_checker", "description": "Scan package lockfiles", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-pro", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 12.0},
            },
        ],
        "workflows": [
            {
                "name": "Incident Detection and Triage",
                "description": "Anomaly Detection -> Log Correlation -> Threat Verification -> Containment -> Post-Mortem",
                "trigger_type": "EVENT",
                "steps": [
                    {"step_name": "Threat Ingestion", "agent": "Threat Hunter Agent"},
                    {"step_name": "SOC Log Correlation", "agent": "SOC Analyst Agent"},
                    {"step_name": "Remediation Verification", "agent": "Vulnerability Auditor Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Zero Critical Vulnerability Policy",
                "description": "No software artifact with known unpatched CVSS >= 8.0 may remain deployed for > 24 hours.",
                "scope": "COMPANY",
                "rules": [{"condition": "unpatched_critical_cve > 0", "action": "ALERT_CISO"}],
                "enforcement_level": "ABSOLUTE",
            }
        ],
        "constitution": {
            "mission": "Protect enterprise sovereignty and digital resilience against all cyber threat actors.",
            "values": ["Uncompromising integrity", "Vigilant paranoia", "Responsible disclosure"],
            "operating_principles": ["Assume every environment is breached until proven clean", "Encrypt everywhere"],
            "prohibited_actions": ["Executing unapproved penetration tests against third-party non-authorized targets", "Storing plain-text private keys"],
            "approval_requirements": ["Emergency host network isolation", "Modifying core perimeter firewall routing"],
            "security_rules": ["Zero-trust mutual TLS required for all agent RPC communications"],
            "financial_rules": ["Security bug bounty payout limits capped at $5,000 without board sign-off"],
            "data_rules": ["Forensic evidence disk images encrypted with client public key"],
            "autonomy_boundaries": {"threat_research": "LEVEL_4", "firewall_rule_changes": "LEVEL_2"},
            "escalation_rules": ["Escalate confirmed breach attempt to CISO within 3 minutes"],
        },
        "recommended_tools": [
            {"name": "siem_collector", "description": "Elastic / Splunk log collector", "risk_level": "LOW"},
            {"name": "firewall_api", "description": "Cloudflare / AWS WAF rule updater", "risk_level": "HIGH"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["threat_intelligence", "incident_remediation", "deep_coding"],
            "recommended_models": ["claude-3-5-sonnet", "gpt-4o"],
        },
        "resource_policies": {"financial_budget_usd": 800.0, "execution_slots": 8},
        "kpis": [
            {"name": "Mean Time to Detect (MTTD)", "metric": "mttd_minutes", "target": "< 5", "review_frequency": "WEEKLY"},
            {"name": "Mean Time to Contain (MTTC)", "metric": "mttc_minutes", "target": "< 15", "review_frequency": "WEEKLY"},
        ],
        "approval_rules": [
            {"action": "ISOLATE_PRODUCTION_CLUSTER", "condition": "scope == 'production'", "approver_role": "ADMIN", "risk_level": "CRITICAL"}
        ],
        "escalation_rules": [
            {"trigger": "Ransomware signature detected", "route_to": "Incident Commander", "severity": "CRITICAL", "sla_minutes": 1}
        ],
    },

    # -------------------------------------------------------------
    # 6. RESEARCH ORGANIZATION
    # -------------------------------------------------------------
    {
        "key": "research_organization",
        "name": "Research Organization",
        "tagline": "Scientific Literature Synthesis, Hypothesis Testing & Deep Analysis",
        "description": "Advanced research institute conducting systematic literature reviews, experimental hypothesis design, quantitative meta-analysis, and whitepaper authorship.",
        "category": "Science & Academia",
        "icon": "book-open",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 320.0,
        "metadata_tags": ["research", "academia", "scientific", "literature-review", "deep-analysis"],
        "company_definition": {
            "name": "Synthetica Institute of Advanced Research",
            "mission": "Accelerate scientific discovery and evidence-based innovation through rigorous AI-driven synthesis and reproducible research methodologies.",
            "vision": "Autonomous scientific hypothesis generation and peer-review level rigor.",
            "industry": "Scientific Research & Development",
            "dna": {
                "operating_philosophy": "Follow empirical evidence, state uncertainty explicitly, verify citations",
                "innovation_level": "RADICAL",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "MODERATE",
                "quality_threshold": "EXCEPTIONAL",
                "decision_style": "CONSENSUS",
                "communication_style": "FORMAL",
                "resource_strategy": "INVEST_HEAVY",
            },
        },
        "departments": [
            {"name": "Literature & Meta-Analysis", "purpose": "Ingesting ArXiv, PubMed, and patent libraries to identify state of the art"},
            {"name": "Hypothesis & Experimental Design", "purpose": "Formulating falsifiable hypotheses and designing statistical tests"},
            {"name": "Publications & Peer Review", "purpose": "Drafting manuscripts, citation verification, and methodological critique"},
        ],
        "roles": [
            {
                "department_name": "Literature & Meta-Analysis",
                "title": "Principal Literature Scientist",
                "responsibilities": ["Conduct systematic domain meta-analyses", "Synthesize consensus findings", "Track citation networks"],
                "capabilities": ["literature_synthesis", "citation_graph_analysis"],
                "authority": "MANAGE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Hypothesis & Experimental Design",
                "title": "Quantitative Methodologist",
                "responsibilities": ["Formulate null hypotheses", "Compute statistical power calculations", "Design control experiments"],
                "capabilities": ["statistical_modeling", "experimental_design", "p_value_validation"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Publications & Peer Review",
                "title": "Scientific Editor & Reviewer",
                "responsibilities": ["Audit manuscript rigor", "Verify source integrity", "Produce peer-review assessments"],
                "capabilities": ["peer_review", "academic_writing", "hallucination_detection"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Literature Synthesizer Agent",
                "role_title": "Principal Literature Scientist",
                "department_name": "Literature & Meta-Analysis",
                "system_instructions": "Read academic papers. Synthesize claims, methodology, and limitations with exact DOI attribution.",
                "responsibilities": ["Literature summaries and state-of-the-art reports"],
                "capabilities": ["literature_synthesis"],
                "tools": [{"name": "arxiv_scholar_api", "description": "Query academic repositories", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 32768, "max_daily_budget_usd": 18.0},
            },
            {
                "name": "Hypothesis Engine Agent",
                "role_title": "Quantitative Methodologist",
                "department_name": "Hypothesis & Experimental Design",
                "system_instructions": "Formulate mathematically sound hypotheses. Define measurable independent and dependent variables.",
                "responsibilities": ["Experiment protocol design"],
                "capabilities": ["statistical_modeling", "experimental_design"],
                "tools": [{"name": "math_symbolic_solver", "description": "SymPy / NumPy calculation engine", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 14.0},
            },
            {
                "name": "Peer Review Auditor Agent",
                "role_title": "Scientific Editor & Reviewer",
                "department_name": "Publications & Peer Review",
                "system_instructions": "Rigorously challenge proposed conclusions. Detect circular reasoning and unproven leaps of logic.",
                "responsibilities": ["Peer review assessments"],
                "capabilities": ["peer_review", "hallucination_detection"],
                "tools": [{"name": "citation_verifier", "description": "Cross-reference claimed DOI references", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-pro", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 12.0},
            },
        ],
        "workflows": [
            {
                "name": "Scientific Discovery Pipeline",
                "description": "Problem Formulation -> Systematic Literature Review -> Hypothesis Generation -> Peer Review Verification",
                "trigger_type": "MANUAL",
                "steps": [
                    {"step_name": "Literature Survey", "agent": "Literature Synthesizer Agent"},
                    {"step_name": "Hypothesis Formulation", "agent": "Hypothesis Engine Agent"},
                    {"step_name": "Peer Review Audit", "agent": "Peer Review Auditor Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Citation Verifiability Policy",
                "description": "Every scientific assertion must cite an active, verifiable primary source with DOI.",
                "scope": "COMPANY",
                "rules": [{"condition": "contains_unverified_citation", "action": "BLOCK_PUBLICATION"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Expand human knowledge through transparent, verifiable, and reproducible intellectual inquiry.",
            "values": ["Intellectual honesty", "Reproducibility", "Methodological transparency"],
            "operating_principles": ["State margins of error honestly", "Never cherry-pick favorable data points"],
            "prohibited_actions": ["Fabricating experimental data", "Publishing unverified claims as settled science"],
            "approval_requirements": ["Public dissemination of whitepapers under company name"],
            "security_rules": ["Proprietary research and patent drafts kept in encrypted air-gapped repositories"],
            "financial_rules": ["Research computing spend allocated per grant milestone"],
            "data_rules": ["Raw datasets published under Open Science Foundation guidelines"],
            "autonomy_boundaries": {"literature_analysis": "LEVEL_5", "whitepaper_publication": "LEVEL_2"},
            "escalation_rules": ["Flag potential research fraud or non-reproducible methodology immediately to Research Board"],
        },
        "recommended_tools": [
            {"name": "semantic_scholar_connector", "description": "Access to 200M+ research papers", "risk_level": "LOW"},
            {"name": "latex_typesetter", "description": "Compile academic PDFs", "risk_level": "LOW"}
        ],
        "intelligence_requirements": {
            "capabilities_required": ["deep_reasoning", "large_context", "academic_writing"],
            "recommended_models": ["claude-3-5-sonnet", "gemini-1.5-pro", "gpt-4o"],
        },
        "resource_policies": {"financial_budget_usd": 500.0, "execution_slots": 6},
        "kpis": [
            {"name": "Research Rigor Score", "metric": "peer_review_acceptance_rate", "target": ">= 90%", "review_frequency": "QUARTERLY"},
            {"name": "Verified Citations", "metric": "citation_accuracy_pct", "target": "100%", "review_frequency": "MONTHLY"},
        ],
        "approval_rules": [
            {"action": "PUBLISH_WHITEPAPER", "condition": "target == 'public'", "approver_role": "ADMIN", "risk_level": "HIGH"}
        ],
        "escalation_rules": [
            {"trigger": "Hallucinated citation detected in manuscript", "route_to": "Lead Research Director", "severity": "HIGH", "sla_minutes": 60}
        ],
    },

    # -------------------------------------------------------------
    # 7. E-COMMERCE COMPANY
    # -------------------------------------------------------------
    {
        "key": "ecommerce_company",
        "name": "E-commerce Company",
        "tagline": "Catalog Merchandising, Supply Chain Tracking & Customer Delight",
        "description": "Direct-to-consumer online retail brand automating catalog copywriting, pricing strategy, inventory reorder alerts, and 24/7 post-purchase support.",
        "category": "Retail & E-commerce",
        "icon": "shopping-cart",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 260.0,
        "metadata_tags": ["ecommerce", "retail", "shopify", "inventory", "customer-support"],
        "company_definition": {
            "name": "AuraGoods Global Retail",
            "mission": "Deliver premium consumer goods worldwide through friction-free discovery, transparent fulfillment, and proactive customer care.",
            "vision": "Autonomous predictive merchandising and zero-friction global commerce.",
            "industry": "E-commerce & Retail",
            "dna": {
                "operating_philosophy": "Customer obsession, inventory velocity, and automated unit economics",
                "innovation_level": "MODERATE",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "MODERATE",
                "quality_threshold": "HIGH",
                "decision_style": "CONSULTATIVE",
                "communication_style": "SEMI_FORMAL",
                "resource_strategy": "BALANCED",
            },
        },
        "departments": [
            {"name": "Merchandising & Catalog", "purpose": "Product descriptions, categorization, and pricing optimization"},
            {"name": "Supply Chain & Fulfillment", "purpose": "Stock level monitoring, supplier PO tracking, and courier logistics"},
            {"name": "Customer Experience", "purpose": "Order tracking, returns processing, and customer ticket resolution"},
        ],
        "roles": [
            {
                "department_name": "Merchandising & Catalog",
                "title": "Digital Merchandiser",
                "responsibilities": ["Optimize product titles and descriptions", "Set pricing rules", "Manage discount coupons"],
                "capabilities": ["catalog_management", "dynamic_pricing", "seo_copywriting"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Supply Chain & Fulfillment",
                "title": "Inventory Controller",
                "responsibilities": ["Forecast stock depletion", "Generate supplier reorder recommendations", "Track logistics delays"],
                "capabilities": ["inventory_forecasting", "logistics_tracking"],
                "authority": "MANAGE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Customer Experience",
                "title": "Customer Success Specialist",
                "responsibilities": ["Resolve shipping status inquiries", "Authorize return merchandise authorizations (RMA)"],
                "capabilities": ["order_lookup", "ticket_resolution", "customer_deescalation"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Catalog Copilot Agent",
                "role_title": "Digital Merchandiser",
                "department_name": "Merchandising & Catalog",
                "system_instructions": "Craft appealing, benefit-driven product copy with SEO keywords and structured JSON-LD specifications.",
                "responsibilities": ["Product description generation"],
                "capabilities": ["catalog_management", "seo_copywriting"],
                "tools": [{"name": "shopify_catalog_tool", "description": "Shopify product API", "risk_level": "MEDIUM"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.7},
                "resource_limits": {"max_tokens_per_call": 6144, "max_daily_budget_usd": 10.0},
            },
            {
                "name": "Inventory Sentinel Agent",
                "role_title": "Inventory Controller",
                "department_name": "Supply Chain & Fulfillment",
                "system_instructions": "Monitor warehouse SKU counts. When inventory drops below 14 days of run-rate, alert operations.",
                "responsibilities": ["Reorder trigger alerts"],
                "capabilities": ["inventory_forecasting"],
                "tools": [{"name": "warehouse_erp_tool", "description": "ERP stock query", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
            {
                "name": "Customer Concierge Agent",
                "role_title": "Customer Success Specialist",
                "department_name": "Customer Experience",
                "system_instructions": "Provide instant, empathetic order support. Process standard returns if within 30-day policy window.",
                "responsibilities": ["24/7 customer support inbox"],
                "capabilities": ["ticket_resolution", "customer_deescalation"],
                "tools": [{"name": "order_lookup_tool", "description": "Retrieve order tracking status", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o-mini", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
        ],
        "workflows": [
            {
                "name": "Order Issue & Return Resolution",
                "description": "Inquiry Received -> Order Ingestion -> Policy Evaluation -> RMA Authorization -> Notification",
                "trigger_type": "WEBHOOK",
                "steps": [
                    {"step_name": "Support Ticket Ingest", "agent": "Customer Concierge Agent"},
                    {"step_name": "Inventory Restock Check", "agent": "Inventory Sentinel Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Refund Ceiling Policy",
                "description": "Automated refunds without manual verification are capped at $75 per customer transaction.",
                "scope": "COMPANY",
                "rules": [{"condition": "refund_amount > 75", "action": "REQUIRE_HUMAN_APPROVAL"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Delight customers globally with high quality products and rapid, transparent customer care.",
            "values": ["Customer respect", "Fulfillment reliability", "Fair pricing"],
            "operating_principles": ["Fix delivery problems promptly without bureaucratic friction"],
            "prohibited_actions": ["Selling out-of-stock items without backorder notification", "Misrepresenting shipping transit times"],
            "approval_requirements": ["Bulk supplier payments > $2,000", "Discount codes exceeding 30%"],
            "security_rules": ["Payment tokenization via PCI-DSS certified gateway (never handle raw cards)"],
            "financial_rules": ["Minimum gross product margin of 45% enforced across all sales"],
            "data_rules": ["Customer addresses purged from temporary cache after shipping label generation"],
            "autonomy_boundaries": {"customer_support": "LEVEL_3", "supplier_reorders": "LEVEL_2"},
            "escalation_rules": ["Escalate angry customer threats or chargebacks to Support Lead"],
        },
        "recommended_tools": [
            {"name": "shopify_admin_bridge", "description": "Storefront integration", "risk_level": "MEDIUM"},
            {"name": "shipstation_bridge", "description": "Courier dispatch API", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["fast_inference", "creative_writing", "empathetic_messaging"],
            "recommended_models": ["gpt-4o-mini", "gpt-4o", "gemini-1.5-flash"],
        },
        "resource_policies": {"financial_budget_usd": 350.0, "execution_slots": 5},
        "kpis": [
            {"name": "First Contact Resolution", "metric": "fcr_pct", "target": ">= 80%", "review_frequency": "WEEKLY"},
            {"name": "Stockout Rate", "metric": "stockout_sku_pct", "target": "< 2%", "review_frequency": "MONTHLY"},
        ],
        "approval_rules": [
            {"action": "ISSUE_REFUND", "condition": "amount > 75", "approver_role": "MANAGER", "risk_level": "MEDIUM"}
        ],
        "escalation_rules": [
            {"trigger": "Courier delivery delay affecting > 50 orders", "route_to": "Head of Logistics", "severity": "HIGH", "sla_minutes": 20}
        ],
    },

    # -------------------------------------------------------------
    # 8. GAME STUDIO
    # -------------------------------------------------------------
    {
        "key": "game_studio",
        "name": "Game Studio",
        "tagline": "Game Mechanics Design, Lore Worldbuilding, Asset Pipelines & Playtesting",
        "description": "Interactive game development studio crafting immersive game worlds, balanced RPG systems, dialogue trees, and automated game loop playtesting.",
        "category": "Gaming & Interactive",
        "icon": "gamepad-2",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 380.0,
        "metadata_tags": ["gaming", "game-dev", "worldbuilding", "narrative", "playtesting", "unity", "unreal"],
        "company_definition": {
            "name": "IronMyth Interactive Studios",
            "mission": "Forge unforgettable interactive entertainment worlds uniting rich systemic gameplay with deeply emotional narratives.",
            "vision": "Living, dynamic virtual worlds shaped continuously by autonomous game systems.",
            "industry": "Interactive Entertainment & Video Games",
            "dna": {
                "operating_philosophy": "Player agency, systemic consistency, iteration through rapid playtesting",
                "innovation_level": "RADICAL",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "AGGRESSIVE",
                "quality_threshold": "EXCEPTIONAL",
                "decision_style": "CONSENSUS",
                "communication_style": "CASUAL",
                "resource_strategy": "GROWTH",
            },
        },
        "departments": [
            {"name": "Game Design & Systems", "purpose": "Combat math, skill progression trees, and economy balancing"},
            {"name": "Narrative & Worldbuilding", "purpose": "Faction lore, NPC dialogue trees, quest scripts, and environmental story"},
            {"name": "Engineering & QA Playtesting", "purpose": "Core mechanics scripting, shader pipelines, and automated bot playtesting"},
        ],
        "roles": [
            {
                "department_name": "Game Design & Systems",
                "title": "Lead Systems Designer",
                "responsibilities": ["Balance combat equations", "Tune loot drop probability curves", "Design boss mechanics"],
                "capabilities": ["game_mechanics_balancing", "economy_tuning", "progression_math"],
                "authority": "MANAGE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Narrative & Worldbuilding",
                "title": "Principal Lore Architect",
                "responsibilities": ["Write branching NPC dialogues", "Develop world history codex", "Script dynamic quest lines"],
                "capabilities": ["narrative_design", "branching_dialogue", "worldbuilding"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Engineering & QA Playtesting",
                "title": "Playtest Automation Engineer",
                "responsibilities": ["Script playtest bots", "Identify soft-locks and progression bugs", "Measure player drop-off"],
                "capabilities": ["game_playtesting", "bug_reporting", "telemetry_logging"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Mechanics Balancer Agent",
                "role_title": "Lead Systems Designer",
                "department_name": "Game Design & Systems",
                "system_instructions": "Balance RPG damage formulas and economy sinks. Prevent dominant strategies that render other builds obsolete.",
                "responsibilities": ["Combat and economy balance simulations"],
                "capabilities": ["game_mechanics_balancing", "economy_tuning"],
                "tools": [{"name": "monte_carlo_simulator", "description": "Loot table Monte Carlo simulator", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 12000, "max_daily_budget_usd": 15.0},
            },
            {
                "name": "Narrative Weaver Agent",
                "role_title": "Principal Lore Architect",
                "department_name": "Narrative & Worldbuilding",
                "system_instructions": "Write compelling character dialogues with distinct voices, subtext, and branching player choices.",
                "responsibilities": ["Quest and dialogue generation"],
                "capabilities": ["narrative_design", "worldbuilding"],
                "tools": [{"name": "dialogue_tree_exporter", "description": "Export Ink / Yarn Spinner format", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.8},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 18.0},
            },
            {
                "name": "Playtest Bot Agent",
                "role_title": "Playtest Automation Engineer",
                "department_name": "Engineering & QA Playtesting",
                "system_instructions": "Execute automated game playthroughs across different player playstyles (aggressive, stealth, completionist).",
                "responsibilities": ["Soft-lock and physics bug detection"],
                "capabilities": ["game_playtesting", "bug_reporting"],
                "tools": [{"name": "game_telemetry_probe", "description": "Inspect player coordinate and health state", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 6144, "max_daily_budget_usd": 10.0},
            },
        ],
        "workflows": [
            {
                "name": "Quest Creation & Playtest Workflow",
                "description": "Quest Outline -> Dialogue Authoring -> Balance Simulation -> Automated Playtest -> Bug Log",
                "trigger_type": "MANUAL",
                "steps": [
                    {"step_name": "Narrative Crafting", "agent": "Narrative Weaver Agent"},
                    {"step_name": "Systems Tuning", "agent": "Mechanics Balancer Agent"},
                    {"step_name": "Playtest Validation", "agent": "Playtest Bot Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Fair Microtransaction Policy",
                "description": "No pay-to-win mechanics or deceptive loot box odds allowed in game design specifications.",
                "scope": "COMPANY",
                "rules": [{"condition": "design_includes_p2w", "action": "BLOCK_DESIGN"}],
                "enforcement_level": "ABSOLUTE",
            }
        ],
        "constitution": {
            "mission": "Create deeply engaging interactive art that respects player time and fosters genuine community.",
            "values": ["Player respect", "Creative fearlessness", "Systemic depth"],
            "operating_principles": ["Fun over friction", "Reward player curiosity through environmental detail"],
            "prohibited_actions": ["Implementing predatory dark patterns in monetization", "Plagiarizing existing game lore or assets"],
            "approval_requirements": ["Master release build gold master sign-off", "IP licensing contracts"],
            "security_rules": ["Game build source code and unwrapped assets watermarked and encrypted"],
            "financial_rules": ["Outsourced voice acting or soundtrack budget allocations require producer review"],
            "data_rules": ["In-game player analytics anonymized without personally identifiable tracking"],
            "autonomy_boundaries": {"worldbuilding": "LEVEL_4", "monetization_structure": "LEVEL_2"},
            "escalation_rules": ["Escalate game-breaking blocker in vertical slice build immediately to Creative Director"],
        },
        "recommended_tools": [
            {"name": "unity_editor_bridge", "description": "Scene hierarchy and asset manager", "risk_level": "MEDIUM"},
            {"name": "yarn_spinner_tool", "description": "Dialogue compilation", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["creative_writing", "game_mechanics_balancing", "deep_reasoning"],
            "recommended_models": ["claude-3-5-sonnet", "gpt-4o"],
        },
        "resource_policies": {"financial_budget_usd": 600.0, "execution_slots": 6},
        "kpis": [
            {"name": "Playtest Bug Discovery", "metric": "bugs_logged_per_build", "target": ">= 10", "review_frequency": "WEEKLY"},
            {"name": "Player Retention Target", "metric": "day_7_retention", "target": ">= 45%", "review_frequency": "MONTHLY"},
        ],
        "approval_rules": [
            {"action": "GOLD_MASTER_RELEASE", "condition": "version_type == 'release'", "approver_role": "ADMIN", "risk_level": "CRITICAL"}
        ],
        "escalation_rules": [
            {"trigger": "Soft-lock detected in primary main quest campaign", "route_to": "Lead Game Designer", "severity": "HIGH", "sla_minutes": 30}
        ],
    },

    # -------------------------------------------------------------
    # 9. IT SERVICES COMPANY
    # -------------------------------------------------------------
    {
        "key": "it_services_company",
        "name": "IT Services Company",
        "tagline": "Enterprise Cloud Infrastructure, Helpdesk Support & System Administration",
        "description": "Managed Service Provider (MSP) and IT consulting firm automating helpdesk ticket resolution, IAM credential management, backup auditing, and cloud migration.",
        "category": "Enterprise Services",
        "icon": "server",
        "is_system_template": True,
        "default_autonomy": 2,
        "estimated_monthly_cost_usd": 300.0,
        "metadata_tags": ["it-services", "msp", "sysadmin", "cloud", "helpdesk", "iam"],
        "company_definition": {
            "name": "NexusPoint Enterprise IT Solutions",
            "mission": "Provide unyielding uptime, seamless workforce enablement, and airtight IT infrastructure management for global enterprises.",
            "vision": "Autonomous self-managing enterprise IT operations.",
            "industry": "Information Technology Services",
            "dna": {
                "operating_philosophy": "Standardized automation, preventive maintenance, and strict privilege management",
                "innovation_level": "MODERATE",
                "autonomy_level": "GUIDED",
                "risk_tolerance": "RISK_AVERSE",
                "quality_threshold": "EXCEPTIONAL",
                "decision_style": "AUTHORITATIVE",
                "communication_style": "FORMAL",
                "resource_strategy": "BALANCED",
            },
        },
        "departments": [
            {"name": "Service Desk & Support", "purpose": "Tier 1-3 helpdesk, password resets, hardware provisioning, and SaaS permissions"},
            {"name": "Cloud & Infrastructure Operations", "purpose": "AWS/Azure cloud instances, Kubernetes clusters, and networking"},
            {"name": "Compliance & Disaster Recovery", "purpose": "Daily backup verification, SOC 2 controls, and business continuity"},
        ],
        "roles": [
            {
                "department_name": "Service Desk & Support",
                "title": "Service Desk Engineer",
                "responsibilities": ["Triage employee support tickets", "Diagnose software errors", "Grant role-based SaaS access"],
                "capabilities": ["helpdesk_triage", "troubleshooting", "iam_administration"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
            {
                "department_name": "Cloud & Infrastructure Operations",
                "title": "Cloud Systems Administrator",
                "responsibilities": ["Manage Terraform state files", "Monitor VM CPU/memory thresholds", "Execute OS patch cycles"],
                "capabilities": ["cloud_administration", "terraform_orchestration", "patch_management"],
                "authority": "MANAGE",
                "autonomy_level": 2,
            },
            {
                "department_name": "Compliance & Disaster Recovery",
                "title": "Business Continuity Auditor",
                "responsibilities": ["Verify daily database snapshots", "Conduct mock restore drills", "Audit SOC 2 evidence"],
                "capabilities": ["backup_verification", "compliance_audit"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Helpdesk Assistant Agent",
                "role_title": "Service Desk Engineer",
                "department_name": "Service Desk & Support",
                "system_instructions": "Resolve user IT tickets quickly. Verify employee identity before executing password resets or permission changes.",
                "responsibilities": ["Automated helpdesk ticket resolution"],
                "capabilities": ["helpdesk_triage", "troubleshooting"],
                "tools": [{"name": "ticket_system_bridge", "description": "ServiceNow / Jira Service Desk API", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o-mini", "temperature": 0.2},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 8.0},
            },
            {
                "name": "SysAdmin Cloud Agent",
                "role_title": "Cloud Systems Administrator",
                "department_name": "Cloud & Infrastructure Operations",
                "system_instructions": "Inspect cloud infrastructure health. Stage patch updates in staging. Require human sign-off for production changes.",
                "responsibilities": ["Cloud instance scaling and patching"],
                "capabilities": ["cloud_administration", "terraform_orchestration"],
                "tools": [{"name": "cloud_cli_tool", "description": "AWS / Azure control bridge", "risk_level": "HIGH"}],
                "autonomy_level": 2,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 14.0},
            },
            {
                "name": "Backup Sentry Agent",
                "role_title": "Business Continuity Auditor",
                "department_name": "Compliance & Disaster Recovery",
                "system_instructions": "Verify all client databases have completed automated snapshots within the past 24 hours. Alert on failures.",
                "responsibilities": ["Disaster recovery readiness audits"],
                "capabilities": ["backup_verification"],
                "tools": [{"name": "snapshot_auditor", "description": "Cloud backup validator", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gemini-1.5-flash", "temperature": 0.0},
                "resource_limits": {"max_tokens_per_call": 4096, "max_daily_budget_usd": 6.0},
            },
        ],
        "workflows": [
            {
                "name": "Access Request Lifecycle",
                "description": "Ticket Submission -> Manager Approval Verification -> IAM Provisioning -> Audit Logging",
                "trigger_type": "WEBHOOK",
                "steps": [
                    {"step_name": "Ticket Ingestion", "agent": "Helpdesk Assistant Agent"},
                    {"step_name": "Privilege Provisioning", "agent": "SysAdmin Cloud Agent"},
                    {"step_name": "Compliance Check", "agent": "Backup Sentry Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Privilege Access Management Policy",
                "description": "Administrative root access must never be granted permanently; enforce temporary just-in-time elevation.",
                "scope": "COMPANY",
                "rules": [{"condition": "permanent_admin_grant", "action": "BLOCK_REQUEST"}],
                "enforcement_level": "ABSOLUTE",
            }
        ],
        "constitution": {
            "mission": "Ensure unbroken business operations and bulletproof IT reliability across all managed enterprise environments.",
            "values": ["Reliability", "Zero data loss", "Customer security"],
            "operating_principles": ["Test all backups periodically", "Never bypass change management tickets"],
            "prohibited_actions": ["Deleting client infrastructure without multi-party approval", "Sharing administrative credentials in plain text"],
            "approval_requirements": ["Production server termination", "Major cloud network routing changes"],
            "security_rules": ["MFA mandatory for all accounts; least-privilege role assignment"],
            "financial_rules": ["Cloud resource provisioning exceeding $200/month requires client sign-off"],
            "data_rules": ["Strict adherence to enterprise client data protection agreements"],
            "autonomy_boundaries": {"helpdesk_troubleshooting": "LEVEL_3", "cloud_provisioning": "LEVEL_2"},
            "escalation_rules": ["Escalate unrecoverable backup failure to VP of Infrastructure within 15 minutes"],
        },
        "recommended_tools": [
            {"name": "aws_management_api", "description": "Cloud API bridge", "risk_level": "HIGH"},
            {"name": "jira_service_desk", "description": "Ticketing integration", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["cloud_administration", "troubleshooting", "fast_inference"],
            "recommended_models": ["claude-3-5-sonnet", "gpt-4o-mini", "gemini-1.5-flash"],
        },
        "resource_policies": {"financial_budget_usd": 400.0, "execution_slots": 6},
        "kpis": [
            {"name": "Ticket Resolution SLA", "metric": "sla_compliance_pct", "target": ">= 98%", "review_frequency": "WEEKLY"},
            {"name": "Backup Success Rate", "metric": "backup_completion_pct", "target": "100%", "review_frequency": "DAILY"},
        ],
        "approval_rules": [
            {"action": "TERMINATE_CLOUD_INSTANCE", "condition": "environment == 'production'", "approver_role": "ADMIN", "risk_level": "CRITICAL"}
        ],
        "escalation_rules": [
            {"trigger": "Major server outage impacting > 100 users", "route_to": "Incident Commander", "severity": "CRITICAL", "sla_minutes": 5}
        ],
    },

    # -------------------------------------------------------------
    # 10. EDUCATION ORGANIZATION
    # -------------------------------------------------------------
    {
        "key": "education_organization",
        "name": "Education Organization",
        "tagline": "Curriculum Design, Adaptive Learning Pathways & Student Mentorship",
        "description": "EdTech academy and learning institution generating structured syllabi, interactive coding tutorials, grading rubric evaluations, and personalized student coaching.",
        "category": "Education & Learning",
        "icon": "graduation-cap",
        "is_system_template": True,
        "default_autonomy": 3,
        "estimated_monthly_cost_usd": 240.0,
        "metadata_tags": ["education", "edtech", "curriculum", "tutoring", "pedagogy", "grading"],
        "company_definition": {
            "name": "Veritas Academy of Applied Intelligence",
            "mission": "Democratize world-class technical education through personalized, adaptive learning systems that empower every student to master modern craft.",
            "vision": "Autonomous 1-on-1 tutoring accessible to every learner on Earth.",
            "industry": "Education & EdTech",
            "dna": {
                "operating_philosophy": "Socratic inquiry, mastery-based progression, and constructive psychological encouragement",
                "innovation_level": "PROGRESSIVE",
                "autonomy_level": "DELEGATED",
                "risk_tolerance": "CAUTIOUS",
                "quality_threshold": "EXCEPTIONAL",
                "decision_style": "CONSULTATIVE",
                "communication_style": "SEMI_FORMAL",
                "resource_strategy": "BALANCED",
            },
        },
        "departments": [
            {"name": "Curriculum & Pedagogy", "purpose": "Designing course syllabi, learning outcomes, and practical project exercises"},
            {"name": "Adaptive Tutoring", "purpose": "Providing 1-on-1 Socratic feedback, explaining difficult concepts, and answering questions"},
            {"name": "Assessment & Evaluation", "purpose": "Grading student assignment submissions against standardized rubrics"},
        ],
        "roles": [
            {
                "department_name": "Curriculum & Pedagogy",
                "title": "Master Instructional Designer",
                "responsibilities": ["Construct progressive module roadmaps", "Author engaging problem sets", "Verify prerequisite alignment"],
                "capabilities": ["curriculum_design", "pedagogical_structuring", "bloom_taxonomy"],
                "authority": "MANAGE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Adaptive Tutoring",
                "title": "Socratic Mentor",
                "responsibilities": ["Guide students to answers without giving the solution directly", "Provide constructive encouragement"],
                "capabilities": ["socratic_dialogue", "concept_simplification", "empathetic_tutoring"],
                "authority": "EXECUTE",
                "autonomy_level": 4,
            },
            {
                "department_name": "Assessment & Evaluation",
                "title": "Academic Assessment Evaluator",
                "responsibilities": ["Grade submitted project code", "Provide granular constructive feedback", "Check for academic honesty"],
                "capabilities": ["rubric_grading", "code_review_pedagogy", "plagiarism_detection"],
                "authority": "EXECUTE",
                "autonomy_level": 3,
            },
        ],
        "agents": [
            {
                "name": "Curriculum Architect Agent",
                "role_title": "Master Instructional Designer",
                "department_name": "Curriculum & Pedagogy",
                "system_instructions": "Build comprehensive course syllabi with progressive difficulty, clear learning outcomes, and real-world milestones.",
                "responsibilities": ["Course design and exercise authoring"],
                "capabilities": ["curriculum_design", "pedagogical_structuring"],
                "tools": [{"name": "curriculum_exporter", "description": "Markdown / LMS exporter", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "claude-3-5-sonnet", "temperature": 0.4},
                "resource_limits": {"max_tokens_per_call": 16384, "max_daily_budget_usd": 12.0},
            },
            {
                "name": "Socratic Tutor Agent",
                "role_title": "Socratic Mentor",
                "department_name": "Adaptive Tutoring",
                "system_instructions": "Use Socratic questioning to guide learners. Explain complex computer science ideas using intuitive analogies.",
                "responsibilities": ["1-on-1 personalized tutoring"],
                "capabilities": ["socratic_dialogue", "concept_simplification"],
                "tools": [{"name": "code_sandbox_runner", "description": "Execute Python snippet safely", "risk_level": "LOW"}],
                "autonomy_level": 4,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.6},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 14.0},
            },
            {
                "name": "Assignment Grader Agent",
                "role_title": "Academic Assessment Evaluator",
                "department_name": "Assessment & Evaluation",
                "system_instructions": "Evaluate submitted projects against the rubric. Highlight strengths before giving actionable correction steps.",
                "responsibilities": ["Project grading and feedback"],
                "capabilities": ["rubric_grading", "plagiarism_detection"],
                "tools": [{"name": "rubric_scorer", "description": "Structured grade score generator", "risk_level": "LOW"}],
                "autonomy_level": 3,
                "intelligence_config": {"model": "gpt-4o", "temperature": 0.1},
                "resource_limits": {"max_tokens_per_call": 8192, "max_daily_budget_usd": 10.0},
            },
        ],
        "workflows": [
            {
                "name": "Student Project Submission & Feedback",
                "description": "Project Received -> Plagiarism Check -> Rubric Assessment -> Personalized Socratic Feedback Delivered",
                "trigger_type": "WEBHOOK",
                "steps": [
                    {"step_name": "Evaluation", "agent": "Assignment Grader Agent"},
                    {"step_name": "Mentorship Follow-up", "agent": "Socratic Tutor Agent"},
                ],
            }
        ],
        "policies": [
            {
                "name": "Academic Rigor & Anti-Cheating Policy",
                "description": "Assessments must test deep conceptual understanding and synthesis rather than rote memorization.",
                "scope": "COMPANY",
                "rules": [{"condition": "contains_unattributed_plagiarism", "action": "FLAG_ACADEMIC_INTEGRITY"}],
                "enforcement_level": "HARD",
            }
        ],
        "constitution": {
            "mission": "Empower learners of all backgrounds through compassionate, rigorous, and individualized educational mentorship.",
            "values": ["Intellectual growth", "Patience", "Accessibility"],
            "operating_principles": ["Celebrate effort and growth mindset", "Every student can master the material with the right scaffolding"],
            "prohibited_actions": ["Belittling student efforts", "Providing complete homework answers directly without fostering inquiry"],
            "approval_requirements": ["Official certificate issuance", "Changing graduation requirements"],
            "security_rules": ["Student grade books and personal learning records protected under FERPA guidelines"],
            "financial_rules": ["Scholarship and fee waiver allocations audited semesterly"],
            "data_rules": ["Student conversation transcripts anonymized before model quality evaluations"],
            "autonomy_boundaries": {"tutoring_interactions": "LEVEL_4", "credential_issuance": "LEVEL_2"},
            "escalation_rules": ["Escalate reports of student distress or severe learning blockers to Academic Dean"],
        },
        "recommended_tools": [
            {"name": "canvas_lms_bridge", "description": "LMS gradebook connector", "risk_level": "LOW"},
            {"name": "python_sandbox", "description": "Safe code evaluation environment", "risk_level": "LOW"},
        ],
        "intelligence_requirements": {
            "capabilities_required": ["empathetic_messaging", "concept_simplification", "deep_coding"],
            "recommended_models": ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-flash"],
        },
        "resource_policies": {"financial_budget_usd": 350.0, "execution_slots": 6},
        "kpis": [
            {"name": "Course Completion Rate", "metric": "completion_pct", "target": ">= 75%", "review_frequency": "MONTHLY"},
            {"name": "Student Satisfaction", "metric": "csat_score", "target": ">= 4.8 / 5.0", "review_frequency": "WEEKLY"},
        ],
        "approval_rules": [
            {"action": "ISSUE_COMPLETION_CERTIFICATE", "condition": "type == 'graduation'", "approver_role": "ADMIN", "risk_level": "HIGH"}
        ],
        "escalation_rules": [
            {"trigger": "Student fails 3 consecutive milestone submissions", "route_to": "Academic Success Counselor", "severity": "MEDIUM", "sla_minutes": 120}
        ],
    },
]
