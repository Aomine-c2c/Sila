.PHONY: help dev dev-api test migrate lint format install

API_DIR = apps/api

help:
	@echo "NEXORA — Autonomous Organization OS"
	@echo ""
	@echo "Usage:"
	@echo "  make install     Install all dependencies"
	@echo "  make dev         Start full stack (docker-compose)"
	@echo "  make dev-api     Start API only (local, hot-reload)"
	@echo "  make test        Run all tests"
	@echo "  make migrate     Run database migrations"
	@echo "  make lint        Run linters"
	@echo "  make format      Format code"

install:
	cd $(API_DIR) && uv sync

dev:
	docker-compose up --build

dev-api:
	cd $(API_DIR) && uv run uvicorn nexora.main:app --reload --host 0.0.0.0 --port 8000

test:
	cd $(API_DIR) && uv run pytest tests/ -v --tb=short

test-cov:
	cd $(API_DIR) && uv run pytest tests/ -v --tb=short --cov=nexora --cov-report=term-missing

migrate:
	cd $(API_DIR) && uv run alembic upgrade head

migrate-new:
	cd $(API_DIR) && uv run alembic revision --autogenerate -m "$(msg)"

migrate-rollback:
	cd $(API_DIR) && uv run alembic downgrade -1

lint:
	cd $(API_DIR) && uv run ruff check nexora/ tests/
	cd $(API_DIR) && uv run mypy nexora/

format:
	cd $(API_DIR) && uv run ruff format nexora/ tests/
	cd $(API_DIR) && uv run ruff check --fix nexora/ tests/

shell:
	cd $(API_DIR) && uv run python -m asyncio
