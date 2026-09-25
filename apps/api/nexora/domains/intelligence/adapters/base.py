"""
Vendor Model Adapters for the NEXORA Intelligence Exchange.
Implements the BaseModelAdapter interface and concrete adapters for:
- Google Gemini
- Anthropic Claude
- OpenAI
- Local / Self-hosted (e.g. Ollama, vLLM, DeepSeek)
"""
from abc import ABC, abstractmethod
import time
from typing import Any

from nexora.domains.intelligence.schemas import ModelRequest, ModelResponsePayload


class BaseModelAdapter(ABC):
    """Abstract adapter defining the contract all AI vendor integrations must satisfy."""

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the canonical provider name, e.g. 'openai', 'anthropic', 'google_gemini', 'local'."""
        pass

    @abstractmethod
    async def generate_response(
        self,
        model_identifier: str,
        request: ModelRequest,
        model_metadata: dict[str, Any],
    ) -> ModelResponsePayload:
        """Execute text or reasoning generation against the vendor model."""
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """Probe provider liveness."""
        pass


class OpenAIMockAdapter(BaseModelAdapter):
    """Adapter for OpenAI models (e.g. GPT-4o, o1, o3-mini)."""

    def get_provider_name(self) -> str:
        return "openai"

    async def generate_response(
        self,
        model_identifier: str,
        request: ModelRequest,
        model_metadata: dict[str, Any],
    ) -> ModelResponsePayload:
        t0 = time.perf_counter()
        # Simulated production generation with realistic latency and cost math
        latency_ms = model_metadata.get("avg_latency_ms", 450.0)
        prompt_len = len(request.prompt.split()) + (len(request.system_prompt.split()) if request.system_prompt else 0)
        prompt_tokens = int(prompt_len * 1.3) + 15
        completion_tokens = 280
        total_tokens = prompt_tokens + completion_tokens

        in_rate = model_metadata.get("input_cost_per_million", 2.50)
        out_rate = model_metadata.get("output_cost_per_million", 10.00)
        cost_usd = (prompt_tokens * in_rate / 1_000_000) + (completion_tokens * out_rate / 1_000_000)

        response_text = (
            f"[OpenAI/{model_identifier}] Synthesized response to: '{request.prompt[:60]}...' "
            f"Adhering to capabilities: {', '.join(request.required_capabilities)}."
        )

        return ModelResponsePayload(
            text=response_text,
            model_used=model_identifier,
            provider_used=self.get_provider_name(),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            latency_ms=latency_ms,
        )

    async def check_health(self) -> bool:
        return True


class AnthropicMockAdapter(BaseModelAdapter):
    """Adapter for Anthropic Claude models (e.g. Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude Opus)."""

    def get_provider_name(self) -> str:
        return "anthropic"

    async def generate_response(
        self,
        model_identifier: str,
        request: ModelRequest,
        model_metadata: dict[str, Any],
    ) -> ModelResponsePayload:
        latency_ms = model_metadata.get("avg_latency_ms", 650.0)
        prompt_len = len(request.prompt.split()) + (len(request.system_prompt.split()) if request.system_prompt else 0)
        prompt_tokens = int(prompt_len * 1.3) + 12
        completion_tokens = 320
        total_tokens = prompt_tokens + completion_tokens

        in_rate = model_metadata.get("input_cost_per_million", 3.00)
        out_rate = model_metadata.get("output_cost_per_million", 15.00)
        cost_usd = (prompt_tokens * in_rate / 1_000_000) + (completion_tokens * out_rate / 1_000_000)

        response_text = (
            f"[Anthropic/{model_identifier}] Analytical architectural output addressing: '{request.prompt[:60]}...' "
            f"Structured according to NEXORA organizational standards."
        )

        return ModelResponsePayload(
            text=response_text,
            model_used=model_identifier,
            provider_used=self.get_provider_name(),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            latency_ms=latency_ms,
        )

    async def check_health(self) -> bool:
        return True


class GeminiMockAdapter(BaseModelAdapter):
    """Adapter for Google Gemini models (e.g. Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash)."""

    def get_provider_name(self) -> str:
        return "google_gemini"

    async def generate_response(
        self,
        model_identifier: str,
        request: ModelRequest,
        model_metadata: dict[str, Any],
    ) -> ModelResponsePayload:
        latency_ms = model_metadata.get("avg_latency_ms", 380.0)
        prompt_len = len(request.prompt.split()) + (len(request.system_prompt.split()) if request.system_prompt else 0)
        prompt_tokens = int(prompt_len * 1.3) + 10
        completion_tokens = 240
        total_tokens = prompt_tokens + completion_tokens

        in_rate = model_metadata.get("input_cost_per_million", 1.25)
        out_rate = model_metadata.get("output_cost_per_million", 5.00)
        cost_usd = (prompt_tokens * in_rate / 1_000_000) + (completion_tokens * out_rate / 1_000_000)

        response_text = (
            f"[Google Gemini/{model_identifier}] High-context response for: '{request.prompt[:60]}...' "
            f"Processed with extended context capacity."
        )

        return ModelResponsePayload(
            text=response_text,
            model_used=model_identifier,
            provider_used=self.get_provider_name(),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            latency_ms=latency_ms,
        )

    async def check_health(self) -> bool:
        return True


class LocalModelMockAdapter(BaseModelAdapter):
    """Adapter for local / self-hosted models (Ollama, vLLM, DeepSeek-R1, Llama 3). Zero API Cost."""

    def get_provider_name(self) -> str:
        return "local"

    async def generate_response(
        self,
        model_identifier: str,
        request: ModelRequest,
        model_metadata: dict[str, Any],
    ) -> ModelResponsePayload:
        latency_ms = model_metadata.get("avg_latency_ms", 850.0)
        prompt_len = len(request.prompt.split()) + (len(request.system_prompt.split()) if request.system_prompt else 0)
        prompt_tokens = int(prompt_len * 1.3) + 8
        completion_tokens = 260
        total_tokens = prompt_tokens + completion_tokens

        # Local models have 0.00 external API cost
        cost_usd = 0.0

        response_text = (
            f"[Local/{model_identifier}] On-premise air-gapped generation for: '{request.prompt[:60]}...' "
            f"Zero external data retention."
        )

        return ModelResponsePayload(
            text=response_text,
            model_used=model_identifier,
            provider_used=self.get_provider_name(),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            latency_ms=latency_ms,
        )

    async def check_health(self) -> bool:
        return True


class ModelAdapterRegistry:
    """Registry coordinating available model provider adapters."""

    def __init__(self) -> None:
        self._adapters: dict[str, BaseModelAdapter] = {}
        # Register core initial providers
        self.register(OpenAIMockAdapter())
        self.register(AnthropicMockAdapter())
        self.register(GeminiMockAdapter())
        self.register(LocalModelMockAdapter())

    def register(self, adapter: BaseModelAdapter) -> None:
        self._adapters[adapter.get_provider_name()] = adapter

    def get(self, provider_name: str) -> BaseModelAdapter | None:
        return self._adapters.get(provider_name)
