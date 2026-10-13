"""
Comprehensive catalog presets for the NEIMAN Intelligence Directory.
Covers 28 top AI providers, routing gateways, frontier models, and local runtimes.
All start UNCONFIGURED until user enters key or URL.
"""

from typing import Any

UNIVERSAL_PROVIDER_CATALOG: list[dict[str, Any]] = [
    # ── Universal AI Routing Gateways & Aggregators ──
    {
        "name": "openrouter",
        "display_name": "OpenRouter",
        "description": "Unified API gateway routing to 200+ frontier and open-weights models with fallback & cost optimization",
        "website_url": "https://openrouter.ai",
        "base_url": "https://openrouter.ai/api/v1",
        "is_local": False,
    },
    {
        "name": "kilocode",
        "display_name": "Kilo Code Gateway",
        "description": "Developer-centric AI gateway connecting multi-model agents with automated tools and cost controls",
        "website_url": "https://kilo.ai",
        "base_url": "https://api.kilo.ai/api/gateway",
        "is_local": False,
    },
    {
        "name": "litellm",
        "display_name": "LiteLLM Proxy",
        "description": "Self-hosted or managed OpenAI-compatible proxy gateway supporting 100+ LLMs with unified spend tracking",
        "website_url": "https://litellm.ai",
        "base_url": "http://localhost:4000/v1",
        "is_local": False,
    },
    {
        "name": "portkey",
        "display_name": "Portkey AI Gateway",
        "description": "Production AI gateway with automated retries, caching, load balancing, and guardrails",
        "website_url": "https://portkey.ai",
        "base_url": "https://api.portkey.ai/v1",
        "is_local": False,
    },

    # ── Frontier AI Labs ──
    {
        "name": "openai",
        "display_name": "OpenAI",
        "description": "Frontier foundation models including GPT-4o, GPT-4o-mini, o1, and o3 reasoning series",
        "website_url": "https://openai.com",
        "base_url": "https://api.openai.com/v1",
        "is_local": False,
    },
    {
        "name": "anthropic",
        "display_name": "Anthropic Claude",
        "description": "Safety-tuned reasoning and coding frontier models (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)",
        "website_url": "https://anthropic.com",
        "base_url": "https://api.anthropic.com/v1",
        "is_local": False,
    },
    {
        "name": "google_gemini",
        "display_name": "Google Gemini",
        "description": "Multimodal frontier intelligence with massive 2M+ context window (Gemini 1.5 Pro, Flash, Flash-Lite)",
        "website_url": "https://ai.google.dev",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "is_local": False,
    },
    {
        "name": "xai",
        "display_name": "xAI (Grok)",
        "description": "Real-time reasoning and truth-seeking intelligence (Grok 2, Grok 2 Vision)",
        "website_url": "https://x.ai",
        "base_url": "https://api.x.ai/v1",
        "is_local": False,
    },

    # ── High-Speed LPUs & Cloud Accelerators ──
    {
        "name": "groq",
        "display_name": "Groq LPU Accelerator",
        "description": "Ultra-low latency Language Processing Unit (LPU) cloud serving open models at 500+ tokens/sec",
        "website_url": "https://groq.com",
        "base_url": "https://api.groq.com/openai/v1",
        "is_local": False,
    },
    {
        "name": "cerebras",
        "display_name": "Cerebras Inference",
        "description": "Wafer-scale AI inference cloud delivering record-breaking speeds for Llama 3.1 & 3.3 models",
        "website_url": "https://cerebras.ai",
        "base_url": "https://api.cerebras.ai/v1",
        "is_local": False,
    },
    {
        "name": "together_ai",
        "display_name": "Together AI",
        "description": "High-throughput cloud inference for open-weights models and custom fine-tunes",
        "website_url": "https://together.ai",
        "base_url": "https://api.together.xyz/v1",
        "is_local": False,
    },
    {
        "name": "fireworks",
        "display_name": "Fireworks AI",
        "description": "Fast production inference engine specializing in compound AI systems and function calling",
        "website_url": "https://fireworks.ai",
        "base_url": "https://api.fireworks.ai/inference/v1",
        "is_local": False,
    },
    {
        "name": "deepinfra",
        "display_name": "DeepInfra",
        "description": "Cost-effective pay-as-you-go serverless inference for cutting-edge open weights",
        "website_url": "https://deepinfra.com",
        "base_url": "https://api.deepinfra.com/v1",
        "is_local": False,
    },

    # ── Specialized & Open Weights Labs ──
    {
        "name": "deepseek",
        "display_name": "DeepSeek Cloud",
        "description": "State-of-the-art open-weights reasoning and coding foundation models (DeepSeek-V3, DeepSeek-R1)",
        "website_url": "https://deepseek.com",
        "base_url": "https://api.deepseek.com/v1",
        "is_local": False,
    },
    {
        "name": "mistral",
        "display_name": "Mistral AI",
        "description": "European frontier intelligence models (Mistral Large 2, Codestral, Pixtral, Ministral)",
        "website_url": "https://mistral.ai",
        "base_url": "https://api.mistral.ai/v1",
        "is_local": False,
    },
    {
        "name": "cohere",
        "display_name": "Cohere",
        "description": "Enterprise intelligence platform (Command R+, Command R, Embed, Rerank) with generous trial tiers",
        "website_url": "https://cohere.com",
        "base_url": "https://api.cohere.com/v2",
        "is_local": False,
    },
    {
        "name": "perplexity",
        "display_name": "Perplexity AI",
        "description": "Search-augmented intelligence models with live web-grounded citations (Sonar, Sonar Pro)",
        "website_url": "https://perplexity.ai",
        "base_url": "https://api.perplexity.ai",
        "is_local": False,
    },
    {
        "name": "dashscope",
        "display_name": "Alibaba DashScope (Qwen)",
        "description": "Comprehensive foundation models from Alibaba Cloud (Qwen 2.5, Qwen 2.5 Coder, Qwen-Max)",
        "website_url": "https://dashscope.aliyun.com",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "is_local": False,
    },
    {
        "name": "zhipu_ai",
        "display_name": "Zhipu AI (GLM)",
        "description": "Leading bilingual reasoning and vision models (GLM-4-Plus, GLM-4-Flash free tier)",
        "website_url": "https://bigmodel.cn",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "is_local": False,
    },
    {
        "name": "zeroone_ai",
        "display_name": "01.AI (Yi)",
        "description": "High-capability open architecture models from Dr. Kai-Fu Lee's 01.AI (Yi-Lightning, Yi-Large)",
        "website_url": "https://01.ai",
        "base_url": "https://api.01.ai/v1",
        "is_local": False,
    },

    # ── Serverless / Free Tier Providers ──
    {
        "name": "cloudflare_workers_ai",
        "display_name": "Cloudflare Workers AI",
        "description": "Serverless edge GPU inference with 10,000 neurons/day free tier (Llama 3.3, DeepSeek, Gemma)",
        "website_url": "https://developers.cloudflare.com/workers-ai/",
        "base_url": "https://api.cloudflare.com/client/v4/ai/v1",
        "is_local": False,
    },
    {
        "name": "huggingface",
        "display_name": "Hugging Face Inference",
        "description": "Serverless inference for 100,000+ open source models via Hugging Face Hub token",
        "website_url": "https://huggingface.co",
        "base_url": "https://api-inference.huggingface.co/v1",
        "is_local": False,
    },
    {
        "name": "github_models",
        "display_name": "GitHub Models",
        "description": "Built-in developer prototype models powered by Azure AI with free GitHub token access",
        "website_url": "https://github.com/marketplace/models",
        "base_url": "https://models.inference.ai.azure.com",
        "is_local": False,
    },
    {
        "name": "aion_labs",
        "display_name": "Aion Labs",
        "description": "Generous free tier reasoning and specialized models (15 RPM, 20k tokens/day)",
        "website_url": "https://aionlabs.ai",
        "base_url": "https://api.aionlabs.ai/v1",
        "is_local": False,
    },

    # ── Local, Private & Self-Hosted Runtimes ──
    {
        "name": "local",
        "display_name": "Local / Air-Gapped",
        "description": "On-premise zero-retention self-hosted models (DeepSeek-R1, Llama 3) with zero cloud dependency",
        "website_url": "http://localhost:11434",
        "base_url": "http://localhost:11434",
        "is_local": True,
    },
    {
        "name": "ollama",
        "display_name": "Ollama Local Runtime",
        "description": "One-click local execution runtime for Llama 3.3, Qwen 2.5, DeepSeek-R1, and Mistral on local GPU/CPU",
        "website_url": "https://ollama.com",
        "base_url": "http://localhost:11434",
        "is_local": True,
    },
    {
        "name": "lm_studio",
        "display_name": "LM Studio Local Server",
        "description": "Desktop GUI and local OpenAI-compatible inference server running GGUF weights locally",
        "website_url": "https://lmstudio.ai",
        "base_url": "http://localhost:1234/v1",
        "is_local": True,
    },
    {
        "name": "vllm",
        "display_name": "vLLM Production Cluster",
        "description": "High-throughput, memory-efficient LLM serving engine with PagedAttention on private clusters",
        "website_url": "https://vllm.ai",
        "base_url": "http://localhost:8000/v1",
        "is_local": True,
    },
    {
        "name": "custom_openai_compatible",
        "display_name": "Custom OpenAI-Compatible / Proxy",
        "description": "Any custom proxy, private enterprise cluster, or endpoint following the OpenAI /v1 schema",
        "website_url": "http://localhost:8000",
        "base_url": "http://localhost:8000/v1",
        "is_local": True,
    },
]
