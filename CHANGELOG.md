# Changelog

## Unreleased

- Added an explicit local development-only auth bypass for UI review; production auth remains guarded. The Control Room now renders a clearly labeled, synthetic organization with representative operational records. Its approval controls are read-only, fixtures are not persisted, and the fixture path makes no API requests.
- Refreshed NEXORA's frontend identity with graphite/lime design tokens, grouped command navigation, and a CSS organizational constellation on sign-in and registration.
- Removed synthetic control-room tasks, providers, memory, and resource telemetry from live/API mode; added real task and memory loading, explicit unavailable states, and data-led status presentation. Synthetic examples are available only in the explicit local UI preview.
- Aligned project/task status and provider mappings with backend response schemas; removed seeded graph nodes, unsupported progress percentages, and the hard-coded fallback-chain illustration.
- Removed a hard-coded demo company ID from the legacy intelligence view. Frontend verification before the synthetic preview change: lint and TypeScript pass, 12 Jest tests pass, and the optimized Next.js production build completes. Desktop and mobile login compositions inspected in the production browser.
- Synthetic preview verification: TypeScript, lint, and all 13 frontend tests pass; the optimized production build completes; the local dashboard was visually reviewed with populated organization records. Sample approvals are disabled, sample performance metrics are labeled, and unavailable performance data is no longer presented as live in API mode.

- Hardened filesystem path containment against sibling-prefix escapes and disabled filesystem access when no allowed roots are configured.
- Hardened outbound URL parsing and exact hostname allowlist matching to reject malformed URLs and allowlist suffix spoofing.
- Preserved provider-reported token usage and measured latency, adding estimates only when providers omit usage values (including local models).
- Added focused regression cases for these boundary failures and adapter accounting behavior.
- Added canonical architecture, roadmap, decision, security, development, and known-issues records.
- Verification: focused security/adapter/intelligence groups passed (26 tests); full API suite passed (125 tests).
- Corrected security readiness wording to document source-defined audit-key and network/runtime isolation limitations.
