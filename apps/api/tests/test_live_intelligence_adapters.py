"""
Tests for live intelligence provider adapter bridges and fallback resilience.
Verifies that when live API keys are provided or unconfigured, the adapters
behave properly, execute correctly, or gracefully fall back without crash.
"""

import pytest
from unittest.mock import patch, AsyncMock, Mock
import httpx
from nexora.config import Settings

from nexora.domains.intelligence.adapters.base import (
    OpenAIMockAdapter,
    AnthropicMockAdapter,
    GeminiMockAdapter,
    LocalModelMockAdapter,
    ProviderRateLimitError,
)
from nexora.domains.intelligence.schemas import ModelRequest


@pytest.mark.asyncio
async def test_openai_adapter_simulated_fallback_when_no_key():
    adapter = OpenAIMockAdapter()
    req = ModelRequest(
        prompt="Synthesize organizational policy",
        required_capabilities=["reasoning"],
    )
    metadata = {"input_cost_per_million": 2.50, "output_cost_per_million": 10.00, "avg_latency_ms": 450.0}

    # With no key set, runs simulated response
    res = await adapter.generate_response("gpt-4o", req, metadata)
    assert res.provider_used == "openai"
    assert "gpt-4o" in res.model_used
    assert res.prompt_tokens > 0
    assert res.completion_tokens > 0


@pytest.mark.asyncio
async def test_openai_adapter_live_execution_mocked_http():
    adapter = OpenAIMockAdapter()
    req = ModelRequest(
        prompt="Analyze revenue trend",
        required_capabilities=["reasoning"],
    )
    metadata = {"input_cost_per_million": 2.50, "output_cost_per_million": 10.00, "avg_latency_ms": 450.0}

    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "Live analysis output from GPT-4o."}}],
        "usage": {"prompt_tokens": 42, "completion_tokens": 128},
    }

    with patch("nexora.config.get_settings", return_value=Settings(OPENAI_API_KEY="sk-mock-live-key")):
        with patch("httpx.AsyncClient.post", return_value=mock_resp):
            res = await adapter.generate_response("gpt-4o", req, metadata)
            assert res.text == "Live analysis output from GPT-4o."
            assert res.prompt_tokens == 42
            assert res.completion_tokens == 128


@pytest.mark.asyncio
async def test_anthropic_adapter_live_execution_mocked_http():
    adapter = AnthropicMockAdapter()
    req = ModelRequest(
        prompt="Review system architecture",
        required_capabilities=["reasoning"],
    )
    metadata = {"input_cost_per_million": 3.00, "output_cost_per_million": 15.00, "avg_latency_ms": 650.0}

    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "content": [{"text": "Live architecture critique from Claude 3.5 Sonnet."}],
        "usage": {"input_tokens": 55, "output_tokens": 160},
    }

    with patch("nexora.config.get_settings", return_value=Settings(ANTHROPIC_API_KEY="sk-ant-mock-key")):
        with patch("httpx.AsyncClient.post", return_value=mock_resp):
            res = await adapter.generate_response("claude-3-5-sonnet", req, metadata)
            assert res.text == "Live architecture critique from Claude 3.5 Sonnet."
            assert res.prompt_tokens == 55
            assert res.completion_tokens == 160


@pytest.mark.asyncio
async def test_gemini_adapter_live_execution_mocked_http():
    adapter = GeminiMockAdapter()
    req = ModelRequest(
        prompt="Process large enterprise dataset",
        required_capabilities=["large_context"],
    )
    metadata = {"input_cost_per_million": 1.25, "output_cost_per_million": 5.00, "avg_latency_ms": 380.0}

    mock_resp = Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Live synthesis from Gemini 1.5 Pro."}]}}],
        "usageMetadata": {"promptTokenCount": 90, "candidatesTokenCount": 210},
    }

    with patch("nexora.config.get_settings", return_value=Settings(GEMINI_API_KEY="mock-gemini-key")):
        with patch("httpx.AsyncClient.post", return_value=mock_resp):
            res = await adapter.generate_response("gemini-1.5-pro", req, metadata)
            assert res.text == "Live synthesis from Gemini 1.5 Pro."
            assert res.prompt_tokens == 90
            assert res.completion_tokens == 210
