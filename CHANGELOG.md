# Changelog

## Unreleased

- Hardened filesystem path containment against sibling-prefix escapes and disabled filesystem access when no allowed roots are configured.
- Hardened outbound URL parsing and exact hostname allowlist matching to reject malformed URLs and allowlist suffix spoofing.
- Preserved provider-reported token usage and measured latency, adding estimates only when providers omit usage values (including local models).
- Added focused regression cases for these boundary failures and adapter accounting behavior.
- Added canonical architecture, roadmap, decision, security, development, and known-issues records.
- Verification: focused security/adapter/intelligence groups passed (26 tests); full API suite passed (125 tests).
- Corrected security readiness wording to document source-defined audit-key and network/runtime isolation limitations.
