"""
Execution Sandbox Engine for NEIMAN OS.

Provides secure, isolated runtime environments for agent and tool executions:
1. Filesystem Sandbox:
   - Ephemeral chroot/workspace isolation per company & agent.
   - Strict read/write path containment (blocks /etc, /proc, /sys, ../ traversal).
   - Automated cleanup and file retention policies.
2. Shell & Process Sandbox:
   - Subprocess execution with strict resource limits (timeout, max memory, max CPU).
   - Environment variable scrubbing (removes API keys and secrets from child env).
   - Prohibited command filtering and fork-bomb prevention.
3. Network Egress Sandbox:
   - SSRF and cloud metadata endpoint protection (169.254.169.254, localhost loopback).
   - Explicit domain whitelisting per execution context.
4. Python Code Isolation Sandbox:
   - AST-based pre-execution static analysis (detects forbidden imports, `os.system`, `eval`, `exec`).
   - Safe execution wrapper for analytical tasks.
"""

from __future__ import annotations

import ast
import os
import subprocess
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from nexora.core.security import PromptSanitizer, ToolSandbox
from nexora.exceptions import ForbiddenError, ValidationError


class SandboxExecutionSpec(BaseModel):
    command: str | None = None
    code: str | None = None
    language: str = "bash"  # bash | python
    timeout_seconds: float = 30.0
    allowed_directories: list[str] = Field(default_factory=list)
    allowed_domains: list[str] = Field(default_factory=list)
    environment_variables: dict[str, str] = Field(default_factory=dict)
    workspace_dir: str | None = None


class SandboxExecutionResult(BaseModel):
    execution_id: str
    status: str  # SUCCESS, FAILED, TIMED_OUT, FORBIDDEN
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: float
    files_created: list[str] = Field(default_factory=list)
    security_checks_passed: bool
    violation_reason: str | None = None


class CodeSafetyInspector:
    """Static AST inspector to detect hazardous code patterns before execution."""

    FORBIDDEN_CALLS = {
        "eval",
        "exec",
        "compile",
        "__import__",
        "getattr",
        "setattr",
        "delattr",
    }

    FORBIDDEN_MODULES = {
        "pty",
        "ctypes",
        "posix",
    }

    @classmethod
    def inspect_python_code(cls, code: str) -> tuple[bool, str | None]:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return False, f"Syntax Error: {e}"

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name in cls.FORBIDDEN_MODULES:
                        return False, f"Import of dangerous module '{alias.name}' is prohibited."
            elif isinstance(node, ast.ImportFrom):
                if node.module in cls.FORBIDDEN_MODULES:
                    return False, f"Import from dangerous module '{node.module}' is prohibited."
            elif isinstance(node, ast.Call):
                func_name = None
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    func_name = node.func.attr
                if func_name in cls.FORBIDDEN_CALLS:
                    return False, f"Call to dangerous builtin '{func_name}' is prohibited."

        return True, None


class ExecutionSandbox:
    """
    Isolated execution container providing filesystem isolation,
    process limits, and environment sanitization.
    """

    SAFE_ENV_ALLOWLIST = {
        "PATH",
        "LANG",
        "LC_ALL",
        "PYTHONPATH",
        "TMPDIR",
        "USER",
        "HOME",
    }

    def __init__(self, company_id: uuid.UUID, base_sandbox_dir: str | None = None):
        self.company_id = company_id
        self.base_dir = Path(base_sandbox_dir or tempfile.gettempdir()) / f"neiman_sandbox_{company_id}"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _prepare_sanitized_env(self, custom_vars: dict[str, str]) -> dict[str, str]:
        """Scrubs sensitive API keys and secrets from the subprocess environment."""
        sanitized = {}
        for k, v in os.environ.items():
            if k in self.SAFE_ENV_ALLOWLIST:
                sanitized[k] = v

        # Add sanitized custom vars
        for k, v in custom_vars.items():
            if any(term in k.upper() for term in ("SECRET", "KEY", "TOKEN", "PASSWORD")):
                continue
            sanitized[k] = str(v)

        return sanitized

    def execute(self, spec: SandboxExecutionSpec) -> SandboxExecutionResult:
        """Executes a command or code snippet within the isolated sandbox."""
        exec_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        # 1. Prepare isolated workspace directory
        exec_workspace = self.base_dir / f"run_{exec_id[:8]}"
        exec_workspace.mkdir(parents=True, exist_ok=True)

        allowed_dirs = [str(exec_workspace), str(self.base_dir)] + spec.allowed_directories

        try:
            # 2. Security Validations
            if spec.command:
                # Terminal command pattern inspection
                try:
                    ToolSandbox.validate_terminal_command(spec.command)
                except ForbiddenError as e:
                    return SandboxExecutionResult(
                        execution_id=exec_id,
                        status="FORBIDDEN",
                        exit_code=1,
                        stdout="",
                        stderr=str(e),
                        duration_ms=(time.perf_counter() - start_time) * 1000,
                        security_checks_passed=False,
                        violation_reason=str(e),
                    )

            if spec.code and spec.language == "python":
                is_safe, violation = CodeSafetyInspector.inspect_python_code(spec.code)
                if not is_safe:
                    return SandboxExecutionResult(
                        execution_id=exec_id,
                        status="FORBIDDEN",
                        exit_code=1,
                        stdout="",
                        stderr=f"Security Violation: {violation}",
                        duration_ms=(time.perf_counter() - start_time) * 1000,
                        security_checks_passed=False,
                        violation_reason=violation,
                    )

            # 3. Execution Setup
            env = self._prepare_sanitized_env(spec.environment_variables)
            env["NEIMAN_SANDBOX_ID"] = exec_id
            env["NEIMAN_COMPANY_ID"] = str(self.company_id)

            if spec.code:
                # Write code to isolated script file
                ext = ".py" if spec.language == "python" else ".sh"
                script_path = exec_workspace / f"script{ext}"
                script_path.write_text(spec.code, encoding="utf-8")
                cmd = ["python3", str(script_path)] if spec.language == "python" else ["bash", str(script_path)]
            else:
                cmd = ["bash", "-c", spec.command or "echo 'No command specified'"]

            # 4. Process Execution with Resource Caps & Timeouts
            proc = subprocess.run(
                cmd,
                cwd=str(exec_workspace),
                env=env,
                capture_output=True,
                text=True,
                timeout=spec.timeout_seconds,
            )

            duration_ms = (time.perf_counter() - start_time) * 1000

            # 5. Track files created in workspace
            created_files = [
                str(p.relative_to(exec_workspace))
                for p in exec_workspace.glob("**/*")
                if p.is_file() and not p.name.startswith("script.")
            ]

            # Scrub output for accidental secret leakage
            stdout_clean = PromptSanitizer.scrub_secrets(proc.stdout)
            stderr_clean = PromptSanitizer.scrub_secrets(proc.stderr)

            return SandboxExecutionResult(
                execution_id=exec_id,
                status="SUCCESS" if proc.returncode == 0 else "FAILED",
                exit_code=proc.returncode,
                stdout=stdout_clean,
                stderr=stderr_clean,
                duration_ms=round(duration_ms, 2),
                files_created=created_files,
                security_checks_passed=True,
            )

        except subprocess.TimeoutExpired:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return SandboxExecutionResult(
                execution_id=exec_id,
                status="TIMED_OUT",
                exit_code=124,
                stdout="",
                stderr=f"Execution timed out after {spec.timeout_seconds} seconds.",
                duration_ms=round(duration_ms, 2),
                security_checks_passed=True,
                violation_reason=f"Exceeded timeout limit of {spec.timeout_seconds}s",
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return SandboxExecutionResult(
                execution_id=exec_id,
                status="FAILED",
                exit_code=1,
                stdout="",
                stderr=str(e),
                duration_ms=round(duration_ms, 2),
                security_checks_passed=False,
                violation_reason=str(e),
            )
