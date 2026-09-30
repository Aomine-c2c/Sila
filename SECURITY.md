# Security

## Security model

NEXORA treats user content, retrieved memory, tool output, and model responses as untrusted. Authorization is enforced per company and capability. Consequential actions require governance checks and, where configured, human approval.

## Current controls and limitations

The API includes prompt scanning, secret/PII scrubbing helpers, filesystem and URL validation helpers, SQL pattern checks, and audit-signature utilities. These checks are defense in depth; they do not make arbitrary shell, database, or network access safe. Enforce least privilege in the runtime, isolate tools at the OS/container boundary, and restrict network egress.

Local dashboard preview can bypass the frontend auth guard only when `NODE_ENV=development` and the explicit preview flag is enabled. It uses labeled, read-only, local fixtures and does not bypass API authorization. Do not enable the flag in a production build.

The audit-signature utility currently has a code-defined key and is not production-grade cryptographic audit storage. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Reporting

Do not put credentials or sensitive customer data in issue reports. Provide a minimal reproduction and affected component through the repository's approved private security reporting channel.
